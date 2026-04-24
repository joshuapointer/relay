/**
 * FAB component tests — RN Testing Library.
 * Asserts primary #003B73 background and press handler.
 */
import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';

import { FAB } from '../components/FAB';

describe('FAB', () => {
  it('renders with default primary color #003B73 background', () => {
    const { getByTestId } = render(<FAB testID="test-fab" />);
    const fab = getByTestId('test-fab');
    // The style prop will contain backgroundColor from nativeTokens.color.primary
    const flatStyle = fab.props.style;
    // Flatten style array to find backgroundColor
    const styles: Record<string, unknown>[] = Array.isArray(flatStyle)
      ? flatStyle.flat(Infinity)
      : [flatStyle];
    const bgStyle = styles.find(
      (s) => s && typeof s === 'object' && 'backgroundColor' in s
    ) as Record<string, unknown> | undefined;
    expect(bgStyle?.backgroundColor).toBe('#003b73');
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <FAB testID="test-fab" onPress={onPress} />
    );
    fireEvent.press(getByTestId('test-fab'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders custom icon', () => {
    const { getByText } = render(<FAB icon="x" />);
    expect(getByText('x')).toBeTruthy();
  });
});
