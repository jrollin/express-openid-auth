import * as dotenv from 'dotenv'
import https from 'https'
import * as fs from 'fs'
import pino from 'pino'
import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import cors from 'cors'
import bodyParser from 'body-parser'
import { loadConfig } from './config'
import { PinoLoggerGateway } from './adapter/gateway/PinoLoggerGateway'
import { configureAuthRouter } from './adapter/http/routes/AuthRouter'
import { configureErrorHandler } from './adapter/http/routes/ErrorHandler'

// logger
const logger = new PinoLoggerGateway(pino())

// config
dotenv.config()
const {
    PORT,
    SSL_CERT,
    SSL_KEY,
    OPENID_CLIENT_ID,
    OPENID_REDIRECT_URL,
    OPENID_AUTH_URL,
    OPENID_TOKEN_URL,
} = loadConfig(logger)

// express
const app: express.Application = express()
app.use(bodyParser.json())
app.use(morgan('tiny'))
app.use(helmet())
app.use(cors())

// auth routes
configureAuthRouter(app, logger, OPENID_CLIENT_ID, OPENID_REDIRECT_URL, OPENID_AUTH_URL, OPENID_TOKEN_URL)
// error handler middleware
configureErrorHandler(app, logger)

// server
https
    .createServer(
        {
            key: fs.readFileSync(SSL_KEY),
            cert: fs.readFileSync(SSL_CERT),
        },
        app
    )
    .listen(PORT, () => {
        logger.info('Started server', { PORT })
        process.on('SIGABRT', cleanTerminate)
        process.on('SIGINT', cleanTerminate)
        process.on('SIGBREAK', cleanTerminate)
    })
// track server termination
const cleanTerminate = (signal: NodeJS.Signals): void => {
    logger.info('cleaning before terminating process ...', { signal })
    process.exit(0)
}
