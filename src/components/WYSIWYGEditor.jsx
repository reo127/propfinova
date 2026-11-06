'use client';

import { useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';

export default function WYSIWYGEditor({ value = '', onChange, placeholder = "Write your content here..." }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setIsReady(true);
    });
  }, []);

  const handleEditorChange = (content) => {
    onChange(content);
  };

  if (!isReady) {
    return (
      <div className="border border-gray-300 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="wysiwyg-editor border border-gray-300 rounded-lg overflow-hidden">
      <Editor
        apiKey="uq5hzjb6crfbpx3eclyfsk6xjwqtwhe7hbkz1xvee5uqderz"
        value={value}
        onEditorChange={handleEditorChange}
        init={{
          height: 300,
          menubar: false,
          placeholder,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help',
          content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; line-height: 1.6; }',
          skin: 'oxide',
          content_css: 'default',
          branding: false,
          promotion: false,
          setup: (editor) => {
            editor.on('init', () => {
              console.log('TinyMCE editor initialized');
            });
          }
        }}
      />

      <style jsx global>{`
        .wysiwyg-editor .tox .tox-editor-header {
          border-bottom: 1px solid #e5e7eb;
        }
        .wysiwyg-editor .tox .tox-toolbar {
          background-color: #f9fafb;
        }
        .wysiwyg-editor .tox .tox-edit-area {
          border: none;
        }
      `}</style>
    </div>
  );
}