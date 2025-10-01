import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ChatStyle, styleTemplates } from '../../types/style';
import { styleService } from '../../services/styleService';
import { User } from 'firebase/auth';
import toast from 'react-hot-toast';

interface StyleManagerProps {
  user: User;
  onStyleSelect?: (style: ChatStyle) => void;
}

const StyleManager: React.FC<StyleManagerProps> = ({ user, onStyleSelect }) => {
  const [styles, setStyles] = useState<ChatStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadUserStyles = React.useCallback(async () => {
    try {
      setLoading(true);
      const userStyles = await styleService.getStylesByUser(user.uid);
      setStyles(userStyles);
    } catch (error) {
      console.error('載入樣式失敗:', error);
      toast.error('載入樣式失敗');
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  useEffect(() => {
    loadUserStyles();
  }, [loadUserStyles]);

  const handleCreateStyle = async (templateIndex?: number) => {
    try {
      const template = templateIndex !== undefined ? styleTemplates[templateIndex] : {};
      const newStyle = await styleService.createStyle(user.uid, {
        name: `新樣式 ${styles.length + 1}`,
        ...template
      });
      
      setStyles([newStyle, ...styles]);
      setShowCreateModal(false);
      toast.success('樣式建立成功！');
    } catch (error) {
      console.error('建立樣式失敗:', error);
      toast.error('建立樣式失敗');
    }
  };

  const handleDeleteStyle = async (styleId: string) => {
    if (!window.confirm('確定要刪除這個樣式嗎？')) return;
    
    try {
      await styleService.deleteStyle(styleId);
      setStyles(styles.filter(s => s.id !== styleId));
      toast.success('樣式已刪除');
    } catch (error) {
      console.error('刪除樣式失敗:', error);
      toast.error('刪除樣式失敗');
    }
  };

  const handleDuplicateStyle = async (style: ChatStyle) => {
    try {
      const duplicatedStyle = await styleService.duplicateStyle(
        style.id, 
        `${style.name} (副本)`, 
        user.uid
      );
      setStyles([duplicatedStyle, ...styles]);
      toast.success('樣式已複製');
    } catch (error) {
      console.error('複製樣式失敗:', error);
      toast.error('複製樣式失敗');
    }
  };

  const generateOBSUrl = (style: ChatStyle) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/overlay/${user.uid}?style=${style.id}`;
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>載入中...</LoadingSpinner>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>🎨 樣式管理</Title>
        <CreateButton onClick={() => setShowCreateModal(true)}>
          + 建立新樣式
        </CreateButton>
      </Header>

      <StyleGrid>
        {styles.map((style) => (
          <StyleCard key={style.id}>
            <StylePreview>
              <PreviewMessage style={style}>
                <Username>測試用戶:</Username>
                <Message>這是預覽訊息</Message>
              </PreviewMessage>
            </StylePreview>
            
            <StyleInfo>
              <StyleName>{style.name}</StyleName>
              <StyleMeta>
                {style.displayMode} • {style.font?.size || 16}px • {style.font?.family || 'Arial'}
              </StyleMeta>
            </StyleInfo>
            
            <StyleActions>
              <ActionButton
                onClick={() => {
                  onStyleSelect?.(style);
                  toast.success('樣式已選擇');
                }}
                primary
              >
                選擇
              </ActionButton>
              <ActionButton onClick={() => toast('編輯功能開發中')}>
                編輯
              </ActionButton>
              <ActionButton onClick={() => handleDuplicateStyle(style)}>
                複製
              </ActionButton>
              <ActionButton 
                onClick={() => {
                  navigator.clipboard.writeText(generateOBSUrl(style));
                  toast.success('OBS 網址已複製到剪貼簿');
                }}
              >
                OBS 網址
              </ActionButton>
              <ActionButton 
                onClick={() => handleDeleteStyle(style.id)}
                danger
              >
                刪除
              </ActionButton>
            </StyleActions>
          </StyleCard>
        ))}
      </StyleGrid>

      {/* 建立樣式模態框 */}
      {showCreateModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h3>建立新樣式</h3>
              <CloseButton onClick={() => setShowCreateModal(false)}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <p>選擇一個模板開始，或建立空白樣式：</p>
              <TemplateGrid>
                <TemplateCard onClick={() => handleCreateStyle()}>
                  <h4>空白樣式</h4>
                  <p>從頭開始建立</p>
                </TemplateCard>
                {styleTemplates.map((template, index) => (
                  <TemplateCard key={index} onClick={() => handleCreateStyle(index)}>
                    <h4>{template.name}</h4>
                    <p>{template.displayMode}</p>
                  </TemplateCard>
                ))}
              </TemplateGrid>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

// 樣式組件
const Container = styled.div`
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h2`
  color: white;
  font-size: 1.5rem;
  margin: 0;
`;

const CreateButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const StyleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const StyleCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(20px);
`;

const StylePreview = styled.div`
  background: #000;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  min-height: 60px;
  display: flex;
  align-items: center;
`;

const PreviewMessage = styled.div<{ style: ChatStyle }>`
  font-family: ${(props) => props.style.font?.family || 'Arial'};
  font-size: ${(props) => props.style.font?.size || 16}px;
  font-weight: ${(props) => props.style.font?.weight || 'normal'};
  color: ${(props) => props.style.font?.color || '#ffffff'};
  background-color: ${(props) => {
    const bgColor = props.style.background?.color || '#000000';
    const bgOpacity = props.style.background?.opacity ?? 0.7;
    const opacity = Math.round(bgOpacity * 255)
      .toString(16)
      .padStart(2, "0");
    return `${bgColor}${opacity}`;
  }};
  padding: ${(props) => props.style.layout?.padding || 10}px;
  border-radius: ${(props) => props.style.layout?.borderRadius || 5}px;
  text-align: ${(props) => props.style.layout?.alignment || 'left'};
  backdrop-filter: ${(props) => {
    const blur = props.style.background?.blur || 0;
    return blur > 0 ? `blur(${blur}px)` : "none";
  }};
`;

const Username = styled.span`
  font-weight: bold;
  margin-right: 0.5rem;
`;

const Message = styled.span``;

const StyleInfo = styled.div`
  margin-bottom: 1rem;
`;

const StyleName = styled.h4`
  color: white;
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
`;

const StyleMeta = styled.p`
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-size: 0.9rem;
`;

const StyleActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ primary?: boolean; danger?: boolean }>`
  background: ${props => 
    props.primary ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
    props.danger ? '#dc3545' : 
    'rgba(255, 255, 255, 0.1)'
  };
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    background: ${props => 
      props.primary ? 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)' :
      props.danger ? '#c82333' : 
      'rgba(255, 255, 255, 0.2)'
    };
  }
`;

const LoadingSpinner = styled.div`
  color: white;
  text-align: center;
  padding: 2rem;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: rgba(15, 15, 35, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  h3 {
    color: white;
    margin: 0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalBody = styled.div`
  color: rgba(255, 255, 255, 0.9);
  
  p {
    margin-bottom: 1.5rem;
  }
`;

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
`;

const TemplateCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }

  h4 {
    color: white;
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
  }

  p {
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    font-size: 0.8rem;
  }
`;

export default StyleManager;
