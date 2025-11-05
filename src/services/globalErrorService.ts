// Global Error Service for handling API errors
import { useMessage } from '@/components/ui/MessageBox';

type MessageProviderType = ReturnType<typeof useMessage>;

class GlobalErrorService {
  private messageProvider: MessageProviderType | null = null;

  // Set the message provider instance
  setMessageProvider(provider: MessageProviderType | null) {
    this.messageProvider = provider;
  }

  // Show timeout error
  showTimeoutError() {
    if (this.messageProvider) {
      this.messageProvider.showError(
        'Request Timeout',
        'The server is taking too long to respond. Please check your connection and try again.'
      );
    }
  }

  // Show network error
  showNetworkError() {
    if (this.messageProvider) {
      this.messageProvider.showError(
        'Network Error',
        'Unable to connect to the server. Please check your internet connection and try again.'
      );
    }
  }

  // Show server error
  showServerError() {
    if (this.messageProvider) {
      this.messageProvider.showError(
        'Internal Server Error',
        'The server encountered an error. Please try again later.'
      );
    }
  }

  // Show client error
  showClientError(title: string, content: string) {
    if (this.messageProvider) {
      this.messageProvider.showError(title, content);
    }
  }
}

// Export singleton instance
export const globalErrorService = new GlobalErrorService();
export default globalErrorService;
