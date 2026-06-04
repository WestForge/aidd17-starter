import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'AIDD-17',
      description: 'A coherent structure for product owners, architects, engineers, and AI to define and deliver software rapidly.',
      social: [],
      sidebar: [
        {
          label: 'Start Here',
          items: [
            { label: 'Overview', slug: 'index' },
            { label: 'Structure', slug: 'structure' },
            { label: 'Delivery Loop', slug: 'delivery-loop' },
            { label: 'Principles', slug: 'principles' },
          ],
        },
        {
          label: 'Templates',
          items: [
            { label: 'Project Definition Template', slug: 'aidd-17-template' },
            { label: 'Implementation Slice Template', slug: 'implementation-slice-template' },
            { label: 'Decision Record', slug: 'templates/decision-record' },
            { label: 'Verification Checklist', slug: 'templates/verification-checklist' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Using AIDD-17 with AI', slug: 'guides/using-with-ai' },
            { label: 'Delivery Rules', slug: 'guides/delivery-rules' },
            { label: 'Common Failure Modes', slug: 'guides/common-failure-modes' },
          ],
        },
        {
          label: 'Examples',
          items: [
            { label: 'Document Assistant', slug: 'document-assistant-example' },
          ],
        },
        {
          label: 'Project Definition Workspace',
          collapsed: true,
          items: [{ autogenerate: { directory: 'aidd-17' } }],
        },
      ],
    }),
  ],
});
