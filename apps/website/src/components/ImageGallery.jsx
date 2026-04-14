import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const ImageGallery = ({ images, isOpen, onClose, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < images.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, currentIndex, images.length, onClose]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const imageUrl = typeof currentImage === 'string' ? currentImage : currentImage.url || currentImage;
  const imageAlt = typeof currentImage === 'string' ? `Image ${currentIndex + 1}` : currentImage.alt_text || currentImage.legend || `Image ${currentIndex + 1}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-300 bg-white/10 hover:bg-white/20 rounded-full p-2 md:p-3 transition-all z-10"
            aria-label="Fermer la galerie"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              {currentIndex > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(currentIndex - 1);
                  }}
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-2 md:p-3 text-white transition-all z-10 touch-manipulation"
                  aria-label="Image précédente"
                >
                  <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              )}
              {currentIndex < images.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(currentIndex + 1);
                  }}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-2 md:p-3 text-white transition-all z-10 touch-manipulation"
                  aria-label="Image suivante"
                >
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              )}
            </>
          )}

          {/* Main Image */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageUrl}
              alt={imageAlt}
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={(e) => {
                e.target.src = 'https://placehold.co/800x600/e2e8f0/e2e8f0?text=Image';
              }}
            />

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute top-4 md:bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm">
                {currentIndex + 1} / {images.length}
              </div>
            )}

            {/* Legend */}
            {typeof currentImage === 'object' && currentImage.legend && (
              <div className="absolute bottom-20 md:bottom-16 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm max-w-[calc(100%-2rem)] md:max-w-2xl text-center">
                {currentImage.legend}
              </div>
            )}
          </motion.div>

          {/* Thumbnail Navigation */}
          {images.length > 1 && (
            <div className="absolute bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[calc(100%-2rem)] md:max-w-4xl overflow-x-auto px-2 md:px-4 pb-2">
              {images.map((img, index) => {
                const thumbUrl = typeof img === 'string' ? img : img.url || img;
                return (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(index);
                    }}
                    className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      currentIndex === index
                        ? 'border-white scale-110'
                        : 'border-white/30 hover:border-white/60 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={thumbUrl}
                      alt={`Miniature ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/80x80/e2e8f0/e2e8f0?text=Image';
                      }}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageGallery;

