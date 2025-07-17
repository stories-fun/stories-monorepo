'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import EditorJS, { BlockToolConstructable, OutputData } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Code from '@editorjs/code';
import InlineCode from '@editorjs/inline-code';
import Embed from '@editorjs/embed';
import Table from '@editorjs/table';
import Warning from '@editorjs/warning';
import ImageTool from '@editorjs/image';
import Quote from '@editorjs/quote';
import Delimiter from '@editorjs/delimiter';
import Underline from '@editorjs/underline';
import Paragraph from '@editorjs/paragraph';

interface EditorProps {
  data?: OutputData;
  onChange?: (data: OutputData) => void;
  holder: string;
  readOnly?: boolean;
}

class CustomEmbed {
  private embed: any;

  constructor({ config }: { config?: { services?: Record<string, any>, inlineToolbar?: boolean } }) {
    this.embed = new Embed(config);
  }

  render() {
    return this.embed.render();
  }

  save(block: HTMLElement) {
    return this.embed.save(block);
  }

  static get toolbox() {
    return Embed.toolbox;
  }

  static get isReadOnlySupported() {
    return Embed.isReadOnlySupported;
  }
}

const Editor = forwardRef<EditorJS | null, EditorProps>(({ data, onChange, holder, readOnly }, ref) => {
  const editorRef = useRef<EditorJS | null>(null);
  const isInitialized = useRef(false);

  // Expose editor instance to parent via ref
  useImperativeHandle(ref, () => editorRef.current as EditorJS);

  useEffect(() => {
    if (!isInitialized.current) {
      const editor = new EditorJS({
        holder,
        data,
        readOnly,
        tools: {
          header: {
            class: Header as unknown as BlockToolConstructable,
            config: {
              placeholder: 'Enter a header',
              levels: [1, 2, 3, 4],
              defaultLevel: 2
            }
          },

          code: Code,
          inlineCode: InlineCode,
          warning: Warning,
          image: {
            class: ImageTool,
            config: {
              uploader: {
                async uploadByFile(file: File) {
                  const formData = new FormData();
                  formData.append('file', file);
          
                  const response = await fetch('/api/ipfs', {
                    method: 'POST',
                    body: formData,
                  });
          
                  const result = await response.json();
          
                  return {
                    success: 1,
                    file: {
                      url: result.file.url,
                    },
                  };
                }
              },
              // Add these new config options
              actions: [
                {
                  name: 'stretched',
                  icon: '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 7H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 8H5V9h14v6z"/></svg>',
                  title: 'Stretch',
                  toggle: true
                },
                {
                  name: 'withBorder',
                  icon: '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 19H5V5h14v14zM5 3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5z"/></svg>',
                  title: 'Border',
                  toggle: true
                },
                {
                  name: 'withBackground',
                  icon: '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>',
                  title: 'Background',
                  toggle: true
                },
                {
                  name: 'rounded',
                  icon: '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>',
                  title: 'Rounded',
                  toggle: true
                },
                {
                  name: 'floatLeft',
                  icon: '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 5h18v2H3zm0 4h12v2H3zm0 4h18v2H3zm0 4h12v2H3z"/></svg>',
                  title: 'Float Left',
                  toggle: true
                },
                {
                  name: 'floatRight',
                  icon: '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 5h18v2H3zm6 4h12v2H9zm-6 4h18v2H3zm6 4h12v2H9z"/></svg>',
                  title: 'Float Right',
                  toggle: true
                }
              ]
            }
          },
          embed: {
            class: Embed as unknown as BlockToolConstructable,
            inlineToolbar: true,
            config: {
              services: {
                youtube: true,
                coub: true,
                codepen: true,
                twitter: true,
                instagram: true,
                facebook: true,
                vimeo: true,
                imgur: true,
                twitch: true,
                gfycat: true,
                spotify: true,
                soundcloud: true,
                // Add any other services you want to support
              }
            }
          },
          quote: {
            class: Quote,
            inlineToolbar: true,
            config: {
              quotePlaceholder: 'Enter a quote',
              captionPlaceholder: "Quote's author"
            }
          },
          delimiter: Delimiter,
          underline: Underline,
          paragraph: {
            class: Paragraph as unknown as BlockToolConstructable,
            inlineToolbar: true
          },

        },
        async onChange(api) {
          if (onChange) {
            const output = await api.saver.save();
            onChange(output);
          }
        },
        placeholder: 'Tell your story...',
        inlineToolbar: true
      });

      editorRef.current = editor;
      isInitialized.current = true;

      return () => {
        if (editorRef.current && editorRef.current.destroy) {
          editorRef.current.destroy();
        }
      };
    }
  }, [holder]);

  return <div id={holder} className="editorjs-container" />;
});

Editor.displayName = 'Editor';

export default Editor;
