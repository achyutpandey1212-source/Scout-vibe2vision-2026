export class ScoutAIError extends Error {
  constructor(
    message: string,
    public readonly details?: any,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AIApiError extends ScoutAIError {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly status?: number,
    details?: any,
  ) {
    super(`[${provider}] API Error: ${message}`, details);
  }
}

export class AIRateLimitError extends AIApiError {
  constructor(provider: string, status?: number, details?: any) {
    super('Rate limit exceeded / Quota exhausted', provider, status, details);
  }
}

export class AITimeoutError extends ScoutAIError {
  constructor(
    message: string,
    public readonly timeoutMs: number,
  ) {
    super(`Request timed out after ${timeoutMs}ms: ${message}`);
  }
}

export class AISchemaValidationError extends ScoutAIError {
  constructor(
    message: string,
    public readonly schemaErrors: any,
    public readonly rawOutput: string,
  ) {
    super(`JSON response did not match expected schema: ${message}`, {
      schemaErrors,
      rawOutput,
    });
  }
}

export class AIIncompleteGenerationError extends ScoutAIError {
  constructor(
    message: string,
    public readonly rawOutput: string,
  ) {
    super(`Incomplete AI Generation: ${message}`, { rawOutput });
  }
}

export class AIParserError extends ScoutAIError {
  constructor(
    message: string,
    public readonly rawOutput: string,
  ) {
    super(`AI JSON Parser Failure: ${message}`, { rawOutput });
  }
}
