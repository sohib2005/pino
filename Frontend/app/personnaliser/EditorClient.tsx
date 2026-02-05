'use client';

import dynamic from 'next/dynamic';

const EditorLayout = dynamic(() => import('../components/editor/EditorLayout'), {
  ssr: false,
  loading: () => (
    <main className="pt-20 px-6">
      Chargement de l’éditeur…
    </main>
  ),
});

export default function EditorClient() {
  return <EditorLayout />;
}
