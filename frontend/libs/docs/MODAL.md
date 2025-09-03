# Modal Component Documentation

## Overview
The Modal component is a highly customizable modal dialog that supports various sizes, positions, and styling options. It includes responsive design, animations, and accessibility features.

## Import
```typescript
import Modal, { BottomSheet, Popup, FullScreenModal } from '@/libs/components/Modal';
```

## Basic Usage
```tsx
<Modal
  visible={isVisible}
  onClose={() => setIsVisible(false)}
  title="Modal Title"
>
  <Text>Modal content goes here</Text>
</Modal>
```

## Props

### Core Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | `boolean` | required | Controls modal visibility |
| `onClose` | `() => void` | required | Callback when modal should close |
| `title` | `string` | - | Modal header title |
| `children` | `React.ReactNode` | required | Modal content |

### Size & Position
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full' \| 'auto'` | `'md'` | Modal size preset |
| `position` | `'center' \| 'bottom' \| 'top'` | `'center'` | Modal position on screen |
| `maxHeight` | `number \| string` | varies | Maximum height of modal |

### Behavior Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showCloseButton` | `boolean` | `true` | Show close button in header |
| `closeOnBackdrop` | `boolean` | `true` | Close modal when backdrop is tapped |
| `showHeader` | `boolean` | `true` | Show modal header |
| `scrollable` | `boolean` | `true` | Make content scrollable |
| `safeArea` | `boolean` | `true` | Respect safe area insets |

### Styling Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `customStyle` | `any` | - | Custom styles for modal container |
| `headerStyle` | `any` | - | Custom styles for header |
| `contentStyle` | `any` | - | Custom styles for content area |
| `footerStyle` | `any` | - | Custom styles for footer |
| `padding` | `boolean` | `true` | Apply default padding to content |

### Advanced Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `footer` | `React.ReactNode` | - | Footer content |
| `headerLeft` | `React.ReactNode` | - | Custom left header component |
| `headerRight` | `React.ReactNode` | - | Custom right header component |
| `transparent` | `boolean` | `false` | Make modal background transparent |
| `blur` | `boolean` | `true` | Apply blur effect to backdrop |
| `backdropColor` | `string` | `'black'` | Backdrop color |
| `backdropOpacity` | `number` | `0.5` | Backdrop opacity (0-1) |
| `animationDuration` | `number` | `300` | Animation duration in ms |
| `keyboardOffset` | `number` | `0` | Keyboard avoiding offset |

## Size Presets

### Small (`sm`)
- Mobile: 90% width, max 400px
- Tablet: 60% width, max 400px
- Desktop: 40% width, max 400px

### Medium (`md`)
- Mobile: 95% width, max 600px
- Tablet: 75% width, max 600px
- Desktop: 60% width, max 600px

### Large (`lg`)
- Mobile: 95% width, max 900px
- Tablet: 85% width, max 900px
- Desktop: 70% width, max 900px

### Extra Large (`xl`)
- Mobile: 100% width, max 1200px
- Desktop: 90% width, max 1200px

### Full (`full`)
- Takes full screen width and height

### Auto (`auto`)
- Width adjusts to content
- Min width: 85% on mobile, 320px on desktop

## Variants

### BottomSheet
Pre-configured modal that slides up from bottom:
```tsx
<BottomSheet
  visible={isVisible}
  onClose={() => setIsVisible(false)}
  title="Select Option"
>
  {/* Options list */}
</BottomSheet>
```

### Popup
Small centered modal for quick actions:
```tsx
<Popup
  visible={isVisible}
  onClose={() => setIsVisible(false)}
  title="Confirm Action"
>
  <Text>Are you sure?</Text>
  <Button onPress={handleConfirm}>Confirm</Button>
</Popup>
```

### FullScreenModal
Full screen modal with safe area support:
```tsx
<FullScreenModal
  visible={isVisible}
  onClose={() => setIsVisible(false)}
  title="Full Screen Content"
>
  {/* Full screen content */}
</FullScreenModal>
```

## Examples

### Form Modal
```tsx
<Modal
  visible={isFormVisible}
  onClose={() => setIsFormVisible(false)}
  title="Edit Profile"
  size="md"
  footer={
    <View style={tw`flex-row gap-3`}>
      <Button variant="outline" onPress={handleCancel} style={tw`flex-1`}>
        Cancel
      </Button>
      <Button variant="primary" onPress={handleSave} style={tw`flex-1`}>
        Save
      </Button>
    </View>
  }
>
  <TextInput label="Name" value={name} onChangeText={setName} />
  <TextInput label="Email" value={email} onChangeText={setEmail} />
</Modal>
```

### Custom Header Modal
```tsx
<Modal
  visible={isVisible}
  onClose={() => setIsVisible(false)}
  title="Notifications"
  headerLeft={<Ionicons name="notifications" size={24} />}
  headerRight={
    <TouchableOpacity onPress={markAllRead}>
      <Text>Mark all read</Text>
    </TouchableOpacity>
  }
>
  {/* Notifications list */}
</Modal>
```

### Filter Modal
```tsx
<Modal
  visible={isFilterVisible}
  onClose={() => setIsFilterVisible(false)}
  title="Filters"
  size="lg"
  position="bottom"
  maxHeight="80%"
>
  {/* Filter options */}
</Modal>
```

### Loading Modal
```tsx
<Modal
  visible={isLoading}
  onClose={() => {}}
  closeOnBackdrop={false}
  showHeader={false}
  size="sm"
  customStyle={tw`bg-transparent`}
  transparent
>
  <View style={tw`items-center py-8`}>
    <ActivityIndicator size="large" />
    <Text style={tw`mt-4`}>Loading...</Text>
  </View>
</Modal>
```

## Best Practices

1. **Size Selection**
   - Use `sm` for confirmations and alerts
   - Use `md` for forms and standard content
   - Use `lg` for complex content or tables
   - Use `full` for immersive experiences

2. **Position**
   - Use `center` for important actions
   - Use `bottom` for mobile-friendly selections
   - Use `top` for notifications or dropdowns

3. **Accessibility**
   - Always provide a close button or method
   - Use clear, descriptive titles
   - Ensure touch targets are at least 44x44

4. **Performance**
   - Use `scrollable={false}` for small, static content
   - Lazy load heavy content inside modals
   - Clean up on unmount

5. **Responsive Design**
   - Test on different screen sizes
   - Use responsive size props
   - Consider mobile-first approach

## Troubleshooting

### Modal content overflows
- Check `maxHeight` prop
- Ensure `scrollable` is true
- Use appropriate `size` preset

### Keyboard covers content
- Adjust `keyboardOffset` prop
- Use `KeyboardAvoidingView` inside content
- Position modal at `top` for forms

### Animation issues
- Adjust `animationDuration`
- Check for conflicting animations
- Ensure proper cleanup

### Backdrop not working
- Check `closeOnBackdrop` prop
- Verify `onClose` handler
- Test backdrop opacity settings