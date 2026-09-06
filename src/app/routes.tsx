import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import RootLayout from './RootLayout';
import Home from './pages/Home';

// Lazy load tools for optimal bundle splitting and performance
const MergeTool = React.lazy(() => import('../features/pdf/merge').then((m) => ({ default: m.MergeTool })));
const SplitTool = React.lazy(() => import('../features/pdf/split').then((m) => ({ default: m.SplitTool })));
const RotateTool = React.lazy(() => import('../features/pdf/rotate').then((m) => ({ default: m.RotateTool })));
const DeletePagesTool = React.lazy(() => import('../features/pdf/delete-pages').then((m) => ({ default: m.DeletePagesTool })));
const ImagesToPdfTool = React.lazy(() => import('../features/pdf/images-to-pdf').then((m) => ({ default: m.ImagesToPdfTool })));
const PdfToImagesTool = React.lazy(() => import('../features/pdf/pdf-to-images').then((m) => ({ default: m.PdfToImagesTool })));
const CompressPdfTool = React.lazy(() => import('../features/pdf/compress').then((m) => ({ default: m.CompressPdfTool })));
const ResizeTool = React.lazy(() => import('../features/images/resize').then((m) => ({ default: m.ResizeTool })));
const CompressTool = React.lazy(() => import('../features/images/compress').then((m) => ({ default: m.CompressTool })));
const ConvertTool = React.lazy(() => import('../features/images/convert').then((m) => ({ default: m.ConvertTool })));
const CropTool = React.lazy(() => import('../features/images/crop').then((m) => ({ default: m.CropTool })));
const RemoveMetadataTool = React.lazy(() => import('../features/images/remove-metadata').then((m) => ({ default: m.RemoveMetadataTool })));

function ToolLoadingFallback() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-neutral-800 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm font-medium text-neutral-400 animate-pulse">Loading tool...</p>
      </div>
    </div>
  );
}

function withSuspense(Component: React.ComponentType) {
  return (
    <Suspense fallback={<ToolLoadingFallback />}>
      <Component />
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'pdf/merge',
        element: withSuspense(MergeTool),
      },
      {
        path: 'pdf/split',
        element: withSuspense(SplitTool),
      },
      {
        path: 'pdf/rotate',
        element: withSuspense(RotateTool),
      },
      {
        path: 'pdf/delete-pages',
        element: withSuspense(DeletePagesTool),
      },
      {
        path: 'pdf/images-to-pdf',
        element: withSuspense(ImagesToPdfTool),
      },
      {
        path: 'pdf/pdf-to-images',
        element: withSuspense(PdfToImagesTool),
      },
      {
        path: 'pdf/compress',
        element: withSuspense(CompressPdfTool),
      },
      {
        path: 'image/resize',
        element: withSuspense(ResizeTool),
      },
      {
        path: 'image/compress',
        element: withSuspense(CompressTool),
      },
      {
        path: 'image/convert',
        element: withSuspense(ConvertTool),
      },
      {
        path: 'image/crop',
        element: withSuspense(CropTool),
      },
      {
        path: 'image/remove-metadata',
        element: withSuspense(RemoveMetadataTool),
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
