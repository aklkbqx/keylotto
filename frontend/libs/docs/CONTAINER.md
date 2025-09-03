# Container Component Documentation

## Overview
The Container component is a highly flexible and feature-rich layout wrapper that provides consistent structure across your React Native Expo/Expo application. It handles safe areas, headers, navigation, loading states, keyboard avoidance, and responsive design for both mobile and web platforms.

## Features

### Core Features
- ✅ **Safe Area Support** - Automatic handling of device safe areas
- ✅ **Header Management** - Customizable header with title, subtitle, and actions
- ✅ **Navigation** - Built-in back button with router integration
- ✅ **Loading States** - Loading overlay with customizable text
- ✅ **Pull to Refresh** - Built-in refresh control
- ✅ **Keyboard Aware** - Automatic keyboard avoidance
- ✅ **Web Responsive** - Max width container for web
- ✅ **Gradient/Blur Backgrounds** - Multiple background options
- ✅ **Floating Action Button** - FAB support with positioning
- ✅ **Footer Support** - Fixed or scrollable footer
- ✅ **Status Bar Control** - Full status bar customization

## Basic Usage

```tsx
import Container from '@/libs/components/Container';

// Simple container with title
<Container title="My Screen">
  <Text>Content goes here</Text>
</Container>

// Container with all features
<Container
  title="Dashboard"
  subtitle="Welcome back!"
  loading={isLoading}
  refreshing={isRefreshing}
  onRefresh={handleRefresh}
  rightActions={[
    <TouchableOpacity onPress={handleSettings}>
      <Icon name="settings" />
    </TouchableOpacity>
  ]}
  footer={
    <Button title="Continue" onPress={handleContinue} />
  }
  stickyFooter
>
  <YourContent />
</Container>
```

## Props Reference

### Content Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | required | The main content of the container |

### Header Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | Header title |
| `subtitle` | `string` | - | Header subtitle |
| `showHeader` | `boolean` | `true` | Whether to show the header |
| `headerStyle` | `ViewStyle` | - | Custom header styles |
| `headerBackground` | `'solid' \| 'gradient' \| 'blur' \| 'transparent'` | `'solid'` | Header background type |
| `headerBackgroundColors` | `string[]` | `['#ffffff', '#f3f4f6']` | Colors for gradient header |
| `headerBlurIntensity` | `number` | `80` | Blur intensity for blur header |

### Navigation Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showBackButton` | `boolean` | `true` | Show back button |
| `onBackPress` | `() => void` | - | Custom back button handler |
| `backButtonIcon` | `ReactNode` | - | Custom back button icon |
| `rightActions` | `ReactNode[]` | `[]` | Right header actions |
| `leftActions` | `ReactNode[]` | `[]` | Left header actions |

### Layout Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `scrollable` | `boolean` | `true` | Make content scrollable |
| `centered` | `boolean` | `false` | Center content |
| `padded` | `boolean` | `true` | Add default padding |
| `paddingHorizontal` | `number` | `16` | Horizontal padding |
| `paddingVertical` | `number` | `16` | Vertical padding |
| `maxWidth` | `number` | `1200` | Max width for web |

### Safe Area Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `safeArea` | `boolean \| 'top' \| 'bottom' \| 'horizontal' \| 'vertical' \| 'all'` | `true` | Safe area configuration |
| `customSafeAreaInsets` | `{top?, bottom?, left?, right?}` | - | Custom safe area insets |

### Background Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `backgroundColor` | `string` | `'#ffffff'` | Background color |
| `backgroundGradient` | `string[]` | - | Gradient background colors |
| `backgroundImage` | `ReactNode` | - | Background image component |

### Loading & Refresh Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `loading` | `boolean` | `false` | Show loading overlay |
| `loadingText` | `string` | `'Loading...'` | Loading text |
| `refreshing` | `boolean` | `false` | Refresh control state |
| `onRefresh` | `() => void` | - | Refresh handler |

### Status Bar Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `statusBarStyle` | `'light-content' \| 'dark-content' \| 'default'` | `'dark-content'` | Status bar style |
| `statusBarHidden` | `boolean` | `false` | Hide status bar |
| `statusBarTranslucent` | `boolean` | `false` | Make status bar translucent |
| `statusBarBackgroundColor` | `string` | - | Status bar background color (Android) |

### Footer Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `footer` | `ReactNode` | - | Footer content |
| `footerStyle` | `ViewStyle` | - | Footer custom styles |
| `stickyFooter` | `boolean` | `false` | Make footer sticky |

### FAB Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fab` | `{icon, onPress, position?, style?}` | - | Floating action button config |

## Usage Examples

### 1. Basic Screen with Header

```tsx
<Container 
  title="Profile"
  subtitle="Manage your account"
>
  <View>
    <Text>Profile content</Text>
  </View>
</Container>
```

### 2. Loading State

```tsx
<Container 
  title="Products"
  loading={isLoading}
  loadingText="Fetching products..."
>
  <ProductList />
</Container>
```

### 3. Pull to Refresh

```tsx
<Container 
  title="Feed"
  refreshing={refreshing}
  onRefresh={async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }}
>
  <FeedItems />
</Container>
```

### 4. Gradient Background

```tsx
<Container 
  title="Premium"
  backgroundGradient={['#667eea', '#764ba2']}
  statusBarStyle="light-content"
>
  <PremiumContent />
</Container>
```

### 5. Web Responsive Layout

```tsx
<Container 
  title="Dashboard"
  isWebWrapper
  webMaxWidth={1024}
>
  <DashboardContent />
</Container>
```

### 6. Sticky Footer with Actions

```tsx
<Container 
  title="Checkout"
  footer={
    <View style={tw`p-4`}>
      <Button title="Proceed to Payment" onPress={handlePayment} />
    </View>
  }
  stickyFooter
>
  <CheckoutItems />
</Container>
```

### 7. FAB Example

```tsx
<Container 
  title="Tasks"
  fab={{
    icon: <Icon name="add" color="white" />,
    onPress: () => navigation.navigate('AddTask'),
    position: 'bottom-right'
  }}
>
  <TaskList />
</Container>
```

### 8. Custom Header Actions

```tsx
<Container 
  title="Chat"
  rightActions={[
    <TouchableOpacity onPress={handleCall}>
      <Icon name="phone" />
    </TouchableOpacity>,
    <TouchableOpacity onPress={handleInfo}>
      <Icon name="info" />
    </TouchableOpacity>
  ]}
>
  <ChatMessages />
</Container>
```

### 9. Blur Header

```tsx
<Container 
  title="Gallery"
  headerBackground="blur"
  headerBlurIntensity={100}
>
  <ImageGallery />
</Container>
```

### 10. No Scroll with Centered Content

```tsx
<Container 
  title="Success"
  scrollable={false}
  centered
  showBackButton={false}
>
  <Icon name="check-circle" size={64} color="green" />
  <Text>Payment Successful!</Text>
</Container>
```

## Platform-Specific Behavior

### iOS
- Safe area insets are automatically applied
- Keyboard avoiding uses padding behavior
- Status bar styling works as expected

### Android
- Hardware back button is handled automatically
- Status bar can be made translucent
- Keyboard avoiding uses height behavior

### Web
- Max width container for desktop screens
- No keyboard avoiding needed
- Responsive design with centered container

## Best Practices

1. **Always use Container** as the root component of your screens
2. **Utilize safe area** options appropriately for different screens
3. **Use loading states** for async operations
4. **Implement pull-to-refresh** for list screens
5. **Consider web responsiveness** with max width settings
6. **Use sticky footer** for action buttons
7. **Customize header** to match your app's design
8. **Handle keyboard** properly for forms

## Customization

You can extend the Container component for app-specific needs:

```tsx
// Create app-specific container
import Container, { ContainerProps } from '@/libs/components/Container';

export const AppContainer: React.FC<ContainerProps> = (props) => {
  return (
    <Container
      headerBackgroundColors={['#your-brand-color', '#your-secondary-color']}
      statusBarStyle="light-content"
      paddingHorizontal={20}
      {...props}
    />
  );
};
```

## Troubleshooting

### Header not showing
- Check if `showHeader` is not set to `false`
- Ensure `title` prop is provided

### Safe area not working
- Make sure `react-native-safe-area-context` is properly installed
- Check if `safeArea` prop is not set to `false`

### Keyboard covering content
- Ensure `keyboardAware` is `true` (default)
- Adjust `keyboardOffset` if needed

### Web layout issues
- Set `isWebWrapper` to `true` for web-specific styling
- Adjust `webMaxWidth` for your design