import { lazy } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { Layout } from './Layout';
import Home from './pages/Home';

const Problems = lazy(() => import('./pages/Problems'));
const ProblemPage = lazy(() => import('./pages/ProblemPage'));
const Daily = lazy(() => import('./pages/Daily'));
const Boss = lazy(() => import('./pages/Boss'));
const Profile = lazy(() => import('./pages/Profile'));
const About = lazy(() => import('./pages/About'));
const JudgeLab = lazy(() => import('./pages/JudgeLab'));
const NotFound = lazy(() => import('./pages/NotFound'));

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/problems', element: <Problems /> },
      { path: '/problem/:slug', element: <ProblemPage /> },
      { path: '/daily', element: <Daily /> },
      { path: '/boss', element: <Boss /> },
      { path: '/profile', element: <Profile /> },
      { path: '/about', element: <About /> },
      { path: '/judge-lab', element: <JudgeLab /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];

export const createRouter = () => createBrowserRouter(routes);
