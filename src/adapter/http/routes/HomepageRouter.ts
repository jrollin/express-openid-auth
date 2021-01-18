import express, { Application, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import { LoggerGateway } from '../../gateway/LoggerGateway'
import { token } from 'morgan'

export const configureHomepageRouter = (
    app: Application,
    logger: LoggerGateway,
    cookieName: string,
) => {
    const router = express.Router()

    router.get('/', cookieParser(), (req: Request, res: Response) => {
        // check already authenticated ?
        const authCookie = req.cookies[cookieName]
        if(authCookie) {
            try{
                const decodeToken = jwt.decode(authCookie);
                res.render('index',  {token: decodeToken})
                return
            }catch(e) {
                logger.error('error decoding jwt', e)
            }
        }

        res.render('index',  {title: 'Home'})
    })

    app.use('/', router)
}
