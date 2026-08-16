import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import RootLayout from './RootLayout';
import Home from './pages/Home';
import { MergeTool } from '../features/pdf/merge';
import { SplitTool } from '../features/pdf/split';

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
      }
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
