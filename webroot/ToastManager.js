class ToastManager {
  constructor() {
    this.container = this.createContainer();
  }

  createContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
    `;
    document.body.appendChild(container);
    return container;
  }

  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      padding: 12px 24px;
      margin-bottom: 10px;
      border-radius: 4px;
      background-color: #333;
      color: white;
      opacity: 0;
      transition: opacity 0.3s ease-in;
    `;

    // Set background color based on type
    switch(type) {
      case 'success':
        toast.style.backgroundColor = '#4caf50';
        break;
      case 'error':
        toast.style.backgroundColor = '#f44336';
        break;
      case 'warning':
        toast.style.backgroundColor = '#ff9800';
        break;
      default:
        toast.style.backgroundColor = '#2196f3';
    }

    this.container.appendChild(toast);
    
    // Trigger reflow to enable animation
    toast.offsetHeight;
    toast.style.opacity = '1';

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        this.container.removeChild(toast);
      }, 300);
    }, duration);
  }

  showWelcomeToast(username) {
    this.show(`Welcome, ${username}!`, 'success', 5000);
  }
}

export default ToastManager;