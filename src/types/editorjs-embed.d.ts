declare module '@editorjs/embed' {
  import { BlockTool, BlockToolData } from '@editorjs/editorjs';

  export interface EmbedData extends BlockToolData {
    service: string;
    source: string;
    embed: string;
    width: string;
    height: string;
    caption: string;
  }

  export default class Embed implements BlockTool {
    constructor(config?: { 
      services?: Record<string, any>;
      inlineToolbar?: boolean;
    });
    render(): HTMLElement;
    save(block: HTMLElement): EmbedData;
    static get toolbox(): {
      icon: string;
      title: string;
    };
    static get isReadOnlySupported(): boolean;
  }
}