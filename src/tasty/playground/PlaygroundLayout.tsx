import { ReactNode } from 'react';

import { Layout } from '../../components/content/Layout';

export interface PlaygroundLayoutProps {
  toolbar: ReactNode;
  editor: ReactNode;
  preview: ReactNode;
  output: ReactNode;
}

export function PlaygroundLayout({
  toolbar,
  editor,
  preview,
  output,
}: PlaygroundLayoutProps) {
  return (
    <Layout height="100vh">
      <Layout.Toolbar>{toolbar}</Layout.Toolbar>

      {/* Bottom panel: CSS Output */}
      <Layout.Panel
        isResizable
        side="bottom"
        defaultSize={250}
        minSize={150}
        maxSize={400}
        contentPadding={0}
      >
        {output}
      </Layout.Panel>

      {/* Inner layout for horizontal split */}
      <Layout>
        {/* Left panel: Editor */}
        <Layout.Panel
          isResizable
          side="left"
          defaultSize={450}
          minSize={300}
          maxSize={700}
          contentPadding={0}
        >
          {editor}
        </Layout.Panel>

        {/* Main content: Preview */}
        <Layout.Content padding={0}>{preview}</Layout.Content>
      </Layout>
    </Layout>
  );
}
