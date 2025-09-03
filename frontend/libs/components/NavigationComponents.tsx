import React from 'react';
import { View, TouchableOpacity, ScrollView, ViewStyle } from 'react-native';
import tw from '@/libs/constants/twrnc';
import { ROLE_THEMES } from '@/libs/constants/theme';
import Text from './Text';
import AnimatedView from './AnimatedView';
import { Ionicons } from '@expo/vector-icons';

// ==================== Breadcrumb Component ====================
interface BreadcrumbItem {
  label: string;
  onPress?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  variant?: 'agent' | 'admin' | 'unit' | 'regional';
  separator?: 'chevron' | 'slash' | 'arrow';
  style?: ViewStyle;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  variant = 'agent',
  separator = 'chevron',
  style,
}) => {
  const theme = ROLE_THEMES[variant];

  const getSeparatorIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (separator) {
      case 'slash':
        return 'remove-outline';
      case 'arrow':
        return 'arrow-forward';
      default:
        return 'chevron-forward';
    }
  };

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={style}
    >
      <View style={tw`flex-row items-center`}>
        {items.map((item, index) => (
          <View key={index} style={tw`flex-row items-center`}>
            <TouchableOpacity
              onPress={item.onPress}
              disabled={!item.onPress || index === items.length - 1}
            >
              <Text
                size="sm"
                weight={index === items.length - 1 ? 'medium' : 'regular'}
                color={
                  index === items.length - 1
                    ? String(tw.color('gray-900'))
                    : item.onPress
                    ? theme.primary
                    : String(tw.color('gray-500'))
                }
              >
                {item.label}
              </Text>
            </TouchableOpacity>
            
            {index < items.length - 1 && (
              <Ionicons
                name={getSeparatorIcon()}
                size={16}
                color={String(tw.color('gray-400'))}
                style={tw`mx-2`}
              />
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// ==================== TabNavigation Component ====================
interface TabItem {
  key: string;
  label: string;
  badge?: number;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (key: string) => void;
  variant?: 'agent' | 'admin' | 'unit' | 'regional';
  type?: 'underline' | 'pill' | 'segment';
  style?: ViewStyle;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  activeTab,
  onTabPress,
  variant = 'agent',
  type = 'underline',
  style,
}) => {
  const theme = ROLE_THEMES[variant];

  const renderUnderlineTabs = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={[tw`border-b border-gray-200`, style]}
    >
      <View style={tw`flex-row`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onTabPress(tab.key)}
              style={tw`px-4 pb-3 mr-4 relative`}
            >
              <View style={tw`flex-row items-center`}>
                {tab.icon && (
                  <Ionicons
                    name={tab.icon}
                    size={20}
                    color={isActive ? theme.primary : String(tw.color('gray-500'))}
                    style={tw`mr-2`}
                  />
                )}
                <Text
                  size="base"
                  weight={isActive ? 'medium' : 'regular'}
                  color={isActive ? theme.primary : String(tw.color('gray-700'))}
                >
                  {tab.label}
                </Text>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <View
                    style={[
                      tw`ml-2 px-2 py-0.5 rounded-full min-w-[20px]`,
                      { backgroundColor: isActive ? theme.primary : String(tw.color('gray-400')) },
                    ]}
                  >
                    <Text size="xs" color="white" weight="medium" style={tw`text-center`}>
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </Text>
                  </View>
                )}
              </View>
              
              {isActive && (
                <View
                  style={[
                    tw`absolute bottom-0 left-0 right-0 h-0.5`,
                    { backgroundColor: theme.primary },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderPillTabs = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={style}
    >
      <View style={tw`flex-row gap-2`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onTabPress(tab.key)}
              style={[
                tw`px-4 py-2 rounded-full flex-row items-center`,
                {
                  backgroundColor: isActive 
                    ? theme.primary 
                    : String(tw.color('gray-100')),
                },
              ]}
            >
              {tab.icon && (
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={isActive ? 'white' : String(tw.color('gray-600'))}
                  style={tw`mr-1.5`}
                />
              )}
              <Text
                size="sm"
                weight="medium"
                color={isActive ? 'white' : String(tw.color('gray-700'))}
              >
                {tab.label}
              </Text>
              {tab.badge !== undefined && tab.badge > 0 && (
                <View
                  style={[
                    tw`ml-2 px-1.5 py-0.5 rounded-full min-w-[18px]`,
                    { 
                      backgroundColor: isActive 
                        ? String(tw.color('white')) 
                        : theme.primary 
                    },
                  ]}
                >
                  <Text 
                    size="xs" 
                    color={isActive ? theme.primary : 'white'} 
                    weight="medium" 
                    style={tw`text-center`}
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderSegmentTabs = () => (
    <View style={[tw`bg-gray-100 p-1 rounded-xl flex-row`, style]}>
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.key;
        
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabPress(tab.key)}
            style={[
              tw`flex-1 py-2 px-3 rounded-lg`,
              isActive && tw`bg-white shadow-sm`,
            ]}
          >
            <AnimatedView
              startScale={isActive ? 0.95 : 1}
              endScale={1}
              duration={150}
            >
              <Text
                size="sm"
                weight={isActive ? 'medium' : 'regular'}
                color={isActive ? theme.primary : String(tw.color('gray-600'))}
                style={tw`text-center`}
              >
                {tab.label}
              </Text>
            </AnimatedView>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  switch (type) {
    case 'pill':
      return renderPillTabs();
    case 'segment':
      return renderSegmentTabs();
    default:
      return renderUnderlineTabs();
  }
};

// ==================== Pagination Component ====================
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  variant?: 'agent' | 'admin' | 'unit' | 'regional';
  showFirstLast?: boolean;
  maxVisible?: number;
  style?: ViewStyle;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  variant = 'agent',
  showFirstLast = true,
  maxVisible = 5,
  style,
}) => {
  const theme = ROLE_THEMES[variant];

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const halfVisible = Math.floor(maxVisible / 2);
      let start = Math.max(1, currentPage - halfVisible);
      let end = Math.min(totalPages, currentPage + halfVisible);
      
      if (currentPage <= halfVisible) {
        end = maxVisible - 1;
      } else if (currentPage > totalPages - halfVisible) {
        start = totalPages - maxVisible + 2;
      }
      
      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <View style={[tw`flex-row items-center justify-center gap-2`, style]}>
      {showFirstLast && (
        <TouchableOpacity
          onPress={() => onPageChange(1)}
          disabled={currentPage === 1}
          style={[
            tw`p-2 rounded-lg`,
            currentPage === 1 && tw`opacity-50`,
          ]}
        >
          <Ionicons
            name="play-back"
            size={16}
            color={currentPage === 1 ? String(tw.color('gray-400')) : theme.primary}
          />
        </TouchableOpacity>
      )}
      
      <TouchableOpacity
        onPress={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        style={[
          tw`p-2 rounded-lg`,
          currentPage === 1 && tw`opacity-50`,
        ]}
      >
        <Ionicons
          name="chevron-back"
          size={20}
          color={currentPage === 1 ? String(tw.color('gray-400')) : theme.primary}
        />
      </TouchableOpacity>

      {pages.map((page, index) => {
        if (page === '...') {
          return (
            <Text key={`ellipsis-${index}`} size="sm" color={String(tw.color('gray-500'))}>
              ...
            </Text>
          );
        }
        
        const pageNum = page as number;
        const isActive = currentPage === pageNum;
        
        return (
          <TouchableOpacity
            key={pageNum}
            onPress={() => onPageChange(pageNum)}
            style={[
              tw`w-9 h-9 rounded-lg items-center justify-center`,
              {
                backgroundColor: isActive ? theme.primary : 'transparent',
              },
            ]}
          >
            <Text
              size="sm"
              weight={isActive ? 'medium' : 'regular'}
              color={isActive ? 'white' : String(tw.color('gray-700'))}
            >
              {pageNum}
            </Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        onPress={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        style={[
          tw`p-2 rounded-lg`,
          currentPage === totalPages && tw`opacity-50`,
        ]}
      >
        <Ionicons
          name="chevron-forward"
          size={20}
          color={currentPage === totalPages ? String(tw.color('gray-400')) : theme.primary}
        />
      </TouchableOpacity>
      
      {showFirstLast && (
        <TouchableOpacity
          onPress={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          style={[
            tw`p-2 rounded-lg`,
            currentPage === totalPages && tw`opacity-50`,
          ]}
        >
          <Ionicons
            name="play-forward"
            size={16}
            color={currentPage === totalPages ? String(tw.color('gray-400')) : theme.primary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};