import { Moon, Sun } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { TouchableOpacity } from 'react-native';

export function ThemeToggle() {
  const { colorScheme, setColorScheme } = useColorScheme();

  return (
    <TouchableOpacity
      onPress={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
    >
      {colorScheme === 'dark' ? (
        <Sun className="text-foreground" size={24} />
      ) : (
        <Moon className="text-foreground" size={24} />
      )}
    </TouchableOpacity>
  );
}
