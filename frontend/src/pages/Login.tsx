import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import styled from 'styled-components';

import { RootState } from '../store/store';
import { login, register, clearError } from '../store/slices/authSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';

// 樣式組件
const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  padding: 2rem 1rem;
`;

const LoginCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 3rem;
  width: 100%;
  max-width: 400px;
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

const LoginHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const LoginTitle = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const LoginSubtitle = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
`;

const FormTabs = styled.div`
  display: flex;
  margin-bottom: 2rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px;
`;

const TabButton = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  background: ${props => props.active ? 'rgba(102, 126, 234, 0.2)' : 'transparent'};
  color: ${props => props.active ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.active ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
    color: #ffffff;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #ffffff;
`;

const Input = styled.input<{ hasError?: boolean }>`
  padding: 0.75rem 1rem;
  border: 1px solid ${props => props.hasError ? '#ef4444' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const Select = styled.select<{ hasError?: boolean }>`
  padding: 0.75rem 1rem;
  border: 1px solid ${props => props.hasError ? '#ef4444' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  option {
    background: #1a1a2e;
    color: #ffffff;
  }
`;

const ErrorMessage = styled.span`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
`;

const SubmitButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ForgotPassword = styled(Link)`
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 0.9rem;
  margin-top: 1rem;
  transition: color 0.2s ease;

  &:hover {
    color: #667eea;
  }
`;

// 表單數據類型
interface LoginFormData {
  username: string;
  password: string;
}

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'viewer' | 'streamer';
}

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, loading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  // 表單處理
  const loginForm = useForm<LoginFormData>();
  const registerForm = useForm<RegisterFormData>();

  const navigate = useNavigate();

  // 如果已經登入，重定向到目標頁面
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, location.state, navigate]);

  // 清除錯誤訊息
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // 處理登入
  const handleLogin = async (data: LoginFormData) => {
    try {
      await dispatch(login(data) as any).unwrap();
      toast.success('登入成功！');
    } catch (error: any) {
      toast.error(error.message || '登入失敗');
    }
  };

  // 處理註冊
  const handleRegister = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('密碼確認不匹配');
      return;
    }

    try {
      const { confirmPassword, ...registerData } = data;
      await dispatch(register(registerData) as any).unwrap();
      toast.success('註冊成功！');
    } catch (error: any) {
      toast.error(error.message || '註冊失敗');
    }
  };

  // 如果已經認證，重定向 - 已在 useEffect 中處理

  return (
    <LoginContainer>
      <LoginCard>
        <LoginHeader>
          <LoginTitle>Streaming Overlay</LoginTitle>
          <LoginSubtitle>
            {isLogin ? '歡迎回來！請登入您的帳號' : '建立您的帳號開始使用'}
          </LoginSubtitle>
        </LoginHeader>

        <FormTabs>
          <TabButton 
            active={isLogin} 
            onClick={() => setIsLogin(true)}
            type="button"
          >
            登入
          </TabButton>
          <TabButton 
            active={!isLogin} 
            onClick={() => setIsLogin(false)}
            type="button"
          >
            註冊
          </TabButton>
        </FormTabs>

        {isLogin ? (
          <Form onSubmit={loginForm.handleSubmit(handleLogin)}>
            <FormGroup>
              <Label>用戶名或電子郵件</Label>
              <Input
                type="text"
                placeholder="請輸入用戶名或電子郵件"
                hasError={!!loginForm.formState.errors.username}
                {...loginForm.register('username', {
                  required: '請輸入用戶名或電子郵件'
                })}
              />
              {loginForm.formState.errors.username && (
                <ErrorMessage>{loginForm.formState.errors.username.message}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label>密碼</Label>
              <Input
                type="password"
                placeholder="請輸入密碼"
                hasError={!!loginForm.formState.errors.password}
                {...loginForm.register('password', {
                  required: '請輸入密碼'
                })}
              />
              {loginForm.formState.errors.password && (
                <ErrorMessage>{loginForm.formState.errors.password.message}</ErrorMessage>
              )}
            </FormGroup>

            <SubmitButton type="submit" disabled={loading}>
              {loading ? <LoadingSpinner size="small" /> : '登入'}
            </SubmitButton>
          </Form>
        ) : (
          <Form onSubmit={registerForm.handleSubmit(handleRegister)}>
            <FormGroup>
              <Label>用戶名</Label>
              <Input
                type="text"
                placeholder="請輸入用戶名"
                hasError={!!registerForm.formState.errors.username}
                {...registerForm.register('username', {
                  required: '請輸入用戶名',
                  minLength: { value: 3, message: '用戶名至少需要3個字符' },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message: '用戶名只能包含字母、數字和下劃線'
                  }
                })}
              />
              {registerForm.formState.errors.username && (
                <ErrorMessage>{registerForm.formState.errors.username.message}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label>電子郵件</Label>
              <Input
                type="email"
                placeholder="請輸入電子郵件"
                hasError={!!registerForm.formState.errors.email}
                {...registerForm.register('email', {
                  required: '請輸入電子郵件',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: '請輸入有效的電子郵件地址'
                  }
                })}
              />
              {registerForm.formState.errors.email && (
                <ErrorMessage>{registerForm.formState.errors.email.message}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label>角色</Label>
              <Select
                hasError={!!registerForm.formState.errors.role}
                {...registerForm.register('role', {
                  required: '請選擇角色'
                })}
              >
                <option value="">請選擇角色</option>
                <option value="viewer">觀眾</option>
                <option value="streamer">直播主</option>
              </Select>
              {registerForm.formState.errors.role && (
                <ErrorMessage>{registerForm.formState.errors.role.message}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label>密碼</Label>
              <Input
                type="password"
                placeholder="請輸入密碼"
                hasError={!!registerForm.formState.errors.password}
                {...registerForm.register('password', {
                  required: '請輸入密碼',
                  minLength: { value: 6, message: '密碼至少需要6個字符' },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: '密碼必須包含至少一個小寫字母、一個大寫字母和一個數字'
                  }
                })}
              />
              {registerForm.formState.errors.password && (
                <ErrorMessage>{registerForm.formState.errors.password.message}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label>確認密碼</Label>
              <Input
                type="password"
                placeholder="請再次輸入密碼"
                hasError={!!registerForm.formState.errors.confirmPassword}
                {...registerForm.register('confirmPassword', {
                  required: '請確認密碼'
                })}
              />
              {registerForm.formState.errors.confirmPassword && (
                <ErrorMessage>{registerForm.formState.errors.confirmPassword.message}</ErrorMessage>
              )}
            </FormGroup>

            <SubmitButton type="submit" disabled={loading}>
              {loading ? <LoadingSpinner size="small" /> : '註冊'}
            </SubmitButton>
          </Form>
        )}

        {isLogin && (
          <ForgotPassword to="/forgot-password">
            忘記密碼？
          </ForgotPassword>
        )}
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
