import { Response } from 'express';
import { ParserMismatchError } from '../sdk/tally/parser';

export function sendSuccess(res: Response, data: any, message = 'Success') {
  return res.status(200).json({
    success: true,
    message,
    data
  });
}

export function sendError(res: Response, error: unknown, statusCode = 500) {
  if (error instanceof ParserMismatchError) {
    return res.status(200).json({
      success: false,
      reason: error.message,
      rawXmlSaved: true,
      diagnostics: error.diagnostics
    });
  }

  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  return res.status(statusCode).json({
    success: false,
    message,
    error: message
  });
}
