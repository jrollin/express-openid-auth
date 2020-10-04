import express, { Application, Request, Response } from 'express'
import cookieParser from 'cookie-parser'
import axios from 'axios'
import { generateCodeChallenge, generateRandomString, urlEncodeParams } from '../../utils/Authentication'
import { LoggerGateway } from '../../gateway/LoggerGateway'

export const configureAuthRouter = (
    app: Application,
    logger: LoggerGateway,
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

        // store verifier with state in short live cookie (5min)
        const cookieData = JSON.stringify({ state, verifier })
        res.cookie(cookieStateName, cookieData, { maxAge: cookieMaxAge, httpOnly: true, secure: true })

        const params: { [key: string]: string } = {
            response_type: 'code',
            response_mode: 'query',
            client_id: openIdClientId,
            scope: 'openid',
            redirect_uri: openIdRedirectUrl,
            state,
            code_challenge: challenge,
            code_challenge_method: 'S256',
        }
        const getAuthCode = openIdAuthUrl.concat('?', urlEncodeParams(params))

        // @todo: display link or redirect ?
        // display link
        return res.send({
            loginUrl: getAuthCode,
        })
    })

    // part 2:: exchange code with access token
    router.get('/login/callback', cookieParser(), async (req: Request, res: Response) => {
        const { code, state } = req.query

        if (code === undefined) {
            logger.error('Authorization code is invalid')
            return res.status(401).json('Authorization request is invalid')
        }
        if (state === undefined) {
            logger.error('Authorization state is invalid')
            return res.status(401).json('Authorization request is invalid')
        }

        // load auth session infos
        const authstate = req.cookies[cookieStateName]
        if (authstate === undefined) {
            logger.error('No session found')
            return res.status(401).json('Authorization request is invalid')
        }

        const cookieData = JSON.parse(authstate)
        if (state !== cookieData.state) {
            logger.error('Authorization state mismatch state in session')
            return res.status(401).json('Authorization request is invalid')
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
            res.cookie('access_token', access_token, { httpOnly: true, secure: true })
            // @todo remove
            // display  infos
            return res.json({ infos: respBody.data })
        } catch (err) {
            logger.error('Error retrieving access token', err)
            return res.status(400).json('Auth failed')
        }
    })
    app.use('/auth', router)
}
