import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

// Mock AuthContext for tests
interface MockAuthProviderProps {
  children: React.ReactNode;
  mockUser?: any;
  mockLoading?: boolean;
}

export const MockAuthProvider: React.FC<MockAuthProviderProps> = ({ 
  children, 
  mockUser = null, 
  mockLoading = false 
}) => {
  // This is a simplified mock - in real tests you'd want to mock the actual context
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
  mockUser?: any;
  mockLoading?: boolean;
}

const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions,
) => {
  const { initialRoute = '/', ...renderOptions } = options || {};

  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute);
  }

  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };
