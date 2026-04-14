/**
 * Sanitization utility to prevent XSS attacks and ensure data integrity.
 * All user input should be sanitized before being inserted into the database.
 *
 * @module utils/sanitize
 */

import { logger } from '@/utils/logger';

/**
 * Sanitizes a string to prevent XSS attacks.
 * Removes potentially dangerous characters and trims whitespace.
 *
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 * @example
 * sanitizeString('<script>alert("XSS")</script>') // Returns: 'alert("XSS")'
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  if (!str) return '';
  
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers (onclick=, onerror=, etc.)
    .replace(/data:text\/html/gi, ''); // Remove data:text/html protocol
};

/**
 * Sanitizes an email address.
 * Trims whitespace and validates format.
 *
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 * @example
 * sanitizeEmail('  user@example.com  ') // Returns: 'user@example.com'
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return email;
  
  return email.trim().toLowerCase();
};

/**
 * Sanitizes a phone number.
 * Removes all non-digit characters except + and spaces.
 *
 * @param {string} phone - Phone number to sanitize
 * @returns {string} Sanitized phone number
 * @example
 * sanitizePhone('06 12 34 56 78') // Returns: '06 12 34 56 78'
 * sanitizePhone('+33612345678') // Returns: '+33612345678'
 */
export const sanitizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return phone;
  
  // Keep digits, spaces, +, -, and parentheses for phone formatting
  return phone.trim().replace(/[^\d\s\+\-\(\)]/g, '');
};

/**
 * Sanitizes form data object recursively.
 * Applies appropriate sanitization based on field type.
 *
 * @param {object} data - Data object to sanitize
 * @returns {object} Sanitized data object
 * @example
 * const formData = {
 *   nom: '  Jean Dupont  ',
 *   email: '  USER@EXAMPLE.COM  ',
 *   telephone: '06 12 34 56 78',
 *   message: '<script>alert("XSS")</script>'
 * };
 * sanitizeFormData(formData);
 * // Returns: {
 * //   nom: 'Jean Dupont',
 * //   email: 'user@example.com',
 * //   telephone: '06 12 34 56 78',
 * //   message: 'alert("XSS")'
 * // }
 */
export const sanitizeFormData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => {
      if (typeof item === 'string') {
        return sanitizeString(item);
      } else if (typeof item === 'object' && item !== null) {
        return sanitizeFormData(item);
      }
      return item;
    });
  }
  
  // Handle null values
  if (data === null) return null;
  
  const sanitized = {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    // Skip null and undefined
    if (value === null || value === undefined) {
      sanitized[key] = value;
      return;
    }
    
    // Sanitize based on type
    if (typeof value === 'string') {
      // Apply specific sanitization based on field name
      if (key.toLowerCase().includes('email') || key === 'email') {
        sanitized[key] = sanitizeEmail(value);
      } else if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('telephone') || key === 'phone') {
        sanitized[key] = sanitizePhone(value);
      } else {
        sanitized[key] = sanitizeString(value);
      }
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      // Numbers and booleans are safe
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      // Recursively sanitize arrays
      sanitized[key] = sanitizeFormData(value);
    } else if (typeof value === 'object') {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeFormData(value);
    } else {
      // Fallback: keep as is
      sanitized[key] = value;
    }
  });
  
  return sanitized;
};

/**
 * Sanitizes a single field value.
 * Automatically detects the type and applies appropriate sanitization.
 *
 * @param {any} value - Value to sanitize
 * @param {string} fieldName - Name of the field (for type detection)
 * @returns {any} Sanitized value
 */
export const sanitizeField = (value, fieldName = '') => {
  if (value === null || value === undefined) return value;
  
  if (typeof value === 'string') {
    if (fieldName.toLowerCase().includes('email')) {
      return sanitizeEmail(value);
    } else if (fieldName.toLowerCase().includes('phone') || fieldName.toLowerCase().includes('telephone')) {
      return sanitizePhone(value);
    } else {
      return sanitizeString(value);
    }
  }
  
  return value;
};

