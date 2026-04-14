import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { File, Upload, Download, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Section Documents avec drag & drop upload et grille de preview
 */
const DocumentsSection = ({ lead, onUpload, onDelete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [documents] = useState(lead.documents || []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      onUpload?.(file);
    });
  }, [onUpload]);

  const handleFileInput = useCallback((e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      onUpload?.(file);
    });
  }, [onUpload]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return ImageIcon;
    }
    return File;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Accordion type="single" collapsible defaultValue="documents" className="w-full">
        <AccordionItem value="documents">
          <AccordionTrigger className="text-lg font-semibold text-gray-900">
            <div className="flex items-center gap-2">
              <File className="h-5 w-5" />
              Documents
              {documents.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({documents.length})
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                {/* Drag & Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    'border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 mb-6',
                    isDragging
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                  )}
                >
                  <Upload className={cn(
                    'h-12 w-12 mx-auto mb-4',
                    isDragging ? 'text-sky-500' : 'text-gray-400'
                  )} />
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {isDragging ? 'Déposez les fichiers ici' : 'Glissez-déposez les fichiers ici'}
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    ou cliquez pour sélectionner des fichiers
                  </p>
                  <label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      as="span"
                      className="cursor-pointer"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choisir des fichiers
                    </Button>
                  </label>
                </div>

                {/* Documents Grid */}
                {documents.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {documents.map((doc, index) => {
                      const FileIcon = getFileIcon(doc.name || 'file');
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="group relative bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col items-center text-center">
                            <FileIcon className="h-12 w-12 text-gray-400 mb-2" />
                            <p className="text-xs font-medium text-gray-900 truncate w-full mb-1">
                              {doc.name || 'Document'}
                            </p>
                            <p className="text-xs text-gray-500 mb-2">
                              {doc.size ? formatFileSize(doc.size) : '-'}
                            </p>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  // TODO: Download file
                                }}
                                className="h-7 w-7 p-0"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onDelete?.(index)}
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <File className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">Aucun document</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </motion.div>
  );
};

export default DocumentsSection;



























