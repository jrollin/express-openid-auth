import express, { Application, Request, Response } from 'express'
import cookieParser from 'cookie-parser'
import axios from 'axios'
import { generateCodeChallenge, generateRandomString, urlEncodeParams } from '../../utils/Authentication'
import { LoggerGateway } from '../../gateway/LoggerGateway'

export const configureAuthRouter = (
    app: Application,
    logger: LoggerGateway,
    redirect: boolean,
    cookieName: string,
    cookieDomain: string,
    openIdClientId: string,
    openIdRedirectUrl: string,
    openIdAuthUrl: string,
    openIdTokenUrl: string
) => {
    const router = express.Router()
    const cookieStateName = 'authstate'
    const cookieMaxAge = 5 * 60 * 1000

    // part 1  : get auth code with unique state
    router.get('/login', (req: Request, res: Response) => {
        // generate verifier and challenge codes
        const verifier: string = generateRandomString(128).toString()
        const challenge: string = generateCodeChallenge(verifier)
        const state: string = generateRandomString(128).toString()
        // redirect to origin URL after success ?
        const originUrl = req.query.originUrl
        // store verifier with state in short live cookie (5min)
        const cookieData = JSON.stringify({ state, verifier, originUrl })
        res.cookie(cookieStateName, cookieData, { maxAge: cookieMaxAge, httpOnly: true, secure: true })

        const params: { [key: string]: string } = {
            response_type: 'code',
            response_mode: 'query',
            client_id: openIdClientId,
            scope: 'openid',
            redirect_uri: openIdRedirectUrl,
            state,
            code_challenge: challenge,
            code_challenge_method: 'S256'
        }
        const getAuthCode = openIdAuthUrl.concat('?', urlEncodeParams(params))

        // @TODO: display or redirect without consent ?
        if (redirect){
            res.redirect(getAuthCode);
            return;
        }
        // display link
        return renderResponse(req, res, { loginUrl: getAuthCode }, 'auth/login' )
    })

    // part 2:: exchange code with access token
    router.get('/login/callback', cookieParser(), async (req: Request, res: Response) => {
        const { code, state } = req.query

        if (code === undefined) {
            logger.error('Authorization code is invalid')
            res.status(401)
            return renderResponse(req, res, {message: 'Authorization request is invalid'}, 'auth/error' )
        }
        if (state === undefined) {
            logger.error('Authorization state is invalid')
            res.status(401)
            return renderResponse(req, res, {message: 'Authorization request is invalid'}, 'auth/error' )
        }

        // load auth session infos
        const authstate = req.cookies[cookieStateName]
        if (authstate === undefined) {
            logger.error('No session found')
            res.status(401)
            return renderResponse(req, res, {message: 'Authorization request is invalid'}, 'auth/error' )
        }

        const cookieData = JSON.parse(authstate)
        if (state !== cookieData.state) {
            logger.error('Authorization state mismatch state in session')
            res.status(401)
            return renderResponse(req, res, {message: 'Authorization request is invalid'}, 'auth/error' )
        }

        try {
            const codeVerifier = cookieData.verifier
            // params for retrieving access token
            const data: { [key: string]: string } = {
                grant_type: 'authorization_code',
                client_id: openIdClientId,
                code: code as string,
                redirect_uri: openIdRedirectUrl,
                code_verifier: codeVerifier,
            }
            // retrieve access token
            const respBody = await axios({
                method: 'post',
                url: openIdTokenUrl,
                data: urlEncodeParams(data),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            })
            const { access_token } = respBody.data
            // store in cookie
            res.cookie(cookieName, access_token, { httpOnly: true, secure: true, domain: cookieDomain })
            // remove state
            res.cookie(cookieStateName, {}, {maxAge: 0})

            // redirect to origin if provided
            const redirectUrl = cookieData.originUrl != null ? cookieData.originUrl : '/'

            // auto redirect 
            if (redirect && cookieData.originUrl != null ){
                res.redirect(redirectUrl);
                return;
            }

            // display  infos
            return renderResponse(req, res, { infos: respBody.data, cookieName, redirectUrl }, 'auth/success')

        } catch (err) {
            logger.error('Error retrieving access token', err)
            res.status(400)
            return renderResponse(req, res, {message: 'Authentication failed'}, 'auth/error' )
        }
    })

    // destroy auth cookie
    router.get('/logout', (req: Request, res: Response) => {
        // delete cookie 
        res.cookie(cookieName, {}, {maxAge: 0, domain: cookieDomain });
        res.redirect('/')
    })


    app.use('/auth', router)
}

const renderResponse = (req: Request, res: Response, args: any, view?: string) => {
    if (req.accepts('html')) {
        res.render(view!, args);
        return;
    }
    res.json(args)
} 