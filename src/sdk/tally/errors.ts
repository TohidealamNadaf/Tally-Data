export class TallyApiError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'TallyApiError';
  }
}

export class TallyConnectionError extends Error {
  constructor(message: string, public readonly cause?: any) {
    super(message);
    this.name = 'TallyConnectionError';
  }
}

export class TallyParseError extends Error {
  constructor(message: string, public readonly rawXml?: string) {
    super(message);
    this.name = 'TallyParseError';
  }
}
