/** @jsxImportSource react */


import DOMPurify from 'dompurify';
import { OutputData } from "@editorjs/editorjs";
import React from 'react';

interface Props {
  data: OutputData;
}

const RenderEditorOutput = ({ data }: Props) => {
  if (!data || !data.blocks) return null;

  return (
    <div className="space-y-4">
      {data.blocks.map((block, index) => {
        switch (block.type) {
          case "paragraph":
            return (
              <p
                key={index}
                className="text-base leading-relaxed my-3"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(block.data.text)
                }}
              />
            );

            case "header":
              const Tag = `h${block.data.level}` as keyof JSX.IntrinsicElements;
              return React.createElement(Tag, {
                key: index,
                className: `font-bold my-${block.data.level + 2}`,
                dangerouslySetInnerHTML: {
                  __html: DOMPurify.sanitize(block.data.text)
                }
              });

          case "list":
            return block.data.style === "ordered" ? (
              <ol key={index} className="list-decimal pl-6 space-y-1">
                {block.data.items.map((item: string, i: number) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item) }} />
                ))}
              </ol>
            ) : (
              <ul key={index} className="list-disc pl-6 space-y-1">
                {block.data.items.map((item: string, i: number) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item) }} />
                ))}
              </ul>
            );

          case "quote":
            return (
              <blockquote key={index} className="border-l-4 border-blue-500 pl-4 italic my-4 bg-[#1A1A1A]/50">
                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(block.data.text)
                  }}
                />
                {block.data.caption && (
                  <footer className="mt-2 text-sm">— {block.data.caption}</footer>
                )}
              </blockquote>
            );

            case 'image': {
                const imageUrl = block.data?.file?.url || block.data?.url;
                if (!imageUrl) return null;
              
                const { withBorder, withBackground, stretched } = block.data;
              
                return (
                  <div
                    key={index}
                    className={`
                      my-6 
                      ${withBackground ? 'bg-[#1A1A1A]/50 p-4 rounded-lg' : ''}
                      ${stretched ? 'w-full' : 'max-w-3xl mx-auto'}
                      ${withBorder ? 'border border-gray-600' : ''}
                    `}
                  >
                    <img
                      src={imageUrl}
                      alt={block.data.caption || 'Story image'}
                      className={`rounded ${stretched ? 'w-full' : 'max-w-full h-auto mx-auto'}`}
                    />
                    {block.data.caption && (
                      <p className="text-center text-sm text-gray-400 mt-2">{block.data.caption}</p>
                    )}
                  </div>
                );
              }
              

          case "code":
            return (
              <pre key={index} className="bg-[#1A1A1A] p-4 rounded-lg overflow-x-auto my-4">
                <code>{block.data.code}</code>
              </pre>
            );

          case "delimiter":
            return (
              <div key={index} className="my-6 text-center text-gray-400">* * *</div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};

export default RenderEditorOutput;
