import { LoggerGateway } from './adapter/gateway/LoggerGateway'

export const loadConfig = (logger: LoggerGateway) => {
    // Server
    if (!process.env.PORT) {
        logger.error('PORT is not defined')
        process.exit(1)
    }
    if (!process.env.HOSTNAME) {
        logger.error('HOSTNAME is not defined')
        process.exit(1)
    }
    // SSL
    if (!process.env.USE_SSL) {
        logger.error('USE_SSL is not defined')
        process.exit(1)
    }

    if (!process.env.SSL_KEY) {
        logger.error('SSL_KEY is not defined')
        process.exit(1)
    }
    if (!process.env.SSL_CERT) {
        logger.error('SSL_CERT is not defined')
        process.exit(1)
    }

    // cookie
    if (!process.env.COOKIE_NAME) {
        logger.error('COOKIE_NAME is not defined')
        process.exit(1)
    }
    if (!process.env.COOKIE_DOMAIN) {
        logger.error('COOKIE_DOMAIN is not defined')
        process.exit(1)
    }

    // authentication
    if (!process.env.OPENID_CLIENT_ID) {
        logger.error('OPENID_CLIENT_ID is not defined')
        process.exit(1)
    }
    if (!process.env.OPENID_REDIRECT_URL) {
        logger.error('OPENID_REDIRECT_URL is not defined')
        process.exit(1)
    }
    if (!process.env.OPENID_AUTH_URL) {
        logger.error('OPENID_AUTH_URL is not defined')
        process.exit(1)
    }
    if (!process.env.OPENID_TOKEN_URL) {
        logger.error('OPENID_TOKEN_URL is not defined')
        process.exit(1)
    }

    return {
        PORT: parseInt(process.env.PORT),
        HOSTNAME: process.env.HOSTNAME,
        USE_SSL: process.env.USE_SSL === 'true',
        SSL_KEY: process.env.SSL_KEY,
        SSL_CERT: process.env.SSL_CERT,
        COOKIE_NAME: process.env.COOKIE_NAME,
        COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
        OPENID_CLIENT_ID: process.env.OPENID_CLIENT_ID,
        OPENID_REDIRECT_URL: process.env.OPENID_REDIRECT_URL,
        OPENID_AUTH_URL: process.env.OPENID_AUTH_URL,
        OPENID_TOKEN_URL: process.env.OPENID_TOKEN_URL,
    }
}
