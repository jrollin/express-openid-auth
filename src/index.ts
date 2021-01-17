import * as dotenv from 'dotenv'
import https from 'https'
import * as fs from 'fs'
import path from 'path'
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
    HOSTNAME,
    SSL_CERT,
    SSL_KEY,
    COOKIE_NAME,
    COOKIE_DOMAIN,
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
//views
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// auth routes
configureAuthRouter(app, logger, COOKIE_NAME, COOKIE_DOMAIN, OPENID_CLIENT_ID, OPENID_REDIRECT_URL, OPENID_AUTH_URL, OPENID_TOKEN_URL)
// error handler middleware
configureErrorHandler(app, logger)

app.get("/", (req, res) => {
    res.render("index", { title: "Home" });
});

// server
const server = https
    .createServer(
        {
            key: fs.readFileSync(SSL_KEY),
            cert: fs.readFileSync(SSL_CERT),
        },
        app
    )
server.listen(PORT, HOSTNAME, () => {
        const URL = `https://${HOSTNAME}:${PORT}`
        logger.info('Started server', {URL})
        process.on('SIGABRT', cleanTerminate)
        process.on('SIGINT', cleanTerminate)
        process.on('SIGBREAK', cleanTerminate)
    })



// track server termination
const cleanTerminate = (signal: NodeJS.Signals): void => {
    logger.info('cleaning before terminating process ...', { signal })
    process.exit(0)
}
