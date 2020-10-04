import { Application, NextFunction, Request, Response } from 'express'
import { LoggerGateway } from '../../gateway/LoggerGateway'

export const configureErrorHandler = (app: Application, logger: LoggerGateway) => {
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        logger.error(err.message)
        const message: string = 'Something went wrong'
        res.status(500).json(message)
    })
}
