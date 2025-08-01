// Gestionnaire de notifications StudyHub
class NotificationManager {
  constructor() {
    this.notifications = [];
    this.container = null;
    this.init();
  }

  init() {
    this.createContainer();
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    this.container.className = 'notification-container';
    document.body.appendChild(this.container);
  }

  show(message, type = 'info', duration = 5000) {
    const notification = this.createNotification(message, type);
    this.container.appendChild(notification);

    // Animation d'entrée
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Auto-suppression
    setTimeout(() => {
      this.hide(notification);
    }, duration);

    // Stocker la notification
    this.notifications.push(notification);
  }

  createNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = this.getIconForType(type);
    
    notification.innerHTML = `
      <div class="notification-content">
        <i class="notification-icon ${icon}"></i>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="notification-progress"></div>
    `;

    return notification;
  }

  getIconForType(type) {
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };
    return icons[type] || icons.info;
  }

  hide(notification) {
    notification.classList.remove('show');
    notification.classList.add('hide');
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      this.notifications = this.notifications.filter(n => n !== notification);
    }, 300);
  }

  clearAll() {
    this.notifications.forEach(notification => {
      this.hide(notification);
    });
  }
}

// Initialiser le gestionnaire de notifications
window.NotificationManager = new NotificationManager();