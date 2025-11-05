// Global event types for error handling
export interface GlobalErrorEvent {
  title: string;
  content: string;
  type: 'error' | 'warning' | 'info' | 'success';
}

// Custom event types
export interface TimeoutErrorEvent extends CustomEvent<GlobalErrorEvent> {
  type: 'showTimeoutError';
}

export interface NetworkErrorEvent extends CustomEvent<GlobalErrorEvent> {
  type: 'showNetworkError';
}

export interface ServerErrorEvent extends CustomEvent<GlobalErrorEvent> {
  type: 'showServerError';
}

export interface ClientErrorEvent extends CustomEvent<GlobalErrorEvent> {
  type: 'showClientError';
}

// Union type for all error events
export type GlobalErrorEvents = 
  | TimeoutErrorEvent 
  | NetworkErrorEvent 
  | ServerErrorEvent 
  | ClientErrorEvent;

// Event listener type
export type GlobalErrorEventListener = (event: GlobalErrorEvents) => void;
