import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import RootLayout from './RootLayout';
import Home from './pages/Home';
import { MergeTool } from '../features/pdf/merge';
import { SplitTool } from '../features/pdf/split';
import { RotateTool } from '../features/pdf/rotate';
import { DeletePagesTool } from '../features/pdf/delete-pages';
import { ImagesToPdfTool } from '../features/pdf/images-to-pdf';
import { ResizeTool } from '../features/images/resize';
import { CompressTool } from '../features/images/compress';
import { ConvertTool } from '../features/images/convert';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: 'pdf/merge',
        element: <MergeTool />
      },
      {
        path: 'pdf/split',
        element: <SplitTool />
      },
      {
        path: 'pdf/rotate',
        element: <RotateTool />
      },
      {
        path: 'pdf/delete-pages',
        element: <DeletePagesTool />
      },
      {
        path: 'pdf/images-to-pdf',
        element: <ImagesToPdfTool />
      },
      {
        path: 'image/resize',
        element: <ResizeTool />
      },
      {
        path: 'image/compress',
        element: <CompressTool />
      },
      {
        path: 'image/convert',
        element: <ConvertTool />
      }
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
