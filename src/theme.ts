import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#e6f7ff',
      100: '#b3e0ff',
      200: '#80c8ff',
      300: '#4db1ff',
      400: '#1a99ff',
      500: '#0080e6',
      600: '#0064b3',
      700: '#004d8c',
      800: '#003666',
      900: '#002040',
    },
    ocean: {
      50: '#e6f3f8',
      100: '#cce7f1',
      200: '#99cfe3',
      300: '#66b7d5',
      400: '#339fc7',
      500: '#0087b9',
      600: '#006c94',
      700: '#00516f',
      800: '#00364a',
      900: '#001b25',
    },
  },
  fonts: {
    heading: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    body: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
        color: props.colorMode === 'dark' ? 'gray.100' : 'gray.800',
      },
    }),
  },
  components: {
    Container: {
      baseStyle: {
        maxW: 'container.xl',
        px: { base: 4, md: 8 },
        py: { base: 4, md: 8 },
      },
    },
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'lg',
        _focus: {
          boxShadow: 'outline',
        },
      },
      variants: {
        solid: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'brand.500' : 'brand.500',
          color: 'white',
          _hover: {
            bg: props.colorMode === 'dark' ? 'brand.600' : 'brand.600',
            transform: 'translateY(-1px)',
            boxShadow: 'lg',
          },
          _active: {
            bg: props.colorMode === 'dark' ? 'brand.700' : 'brand.700',
            transform: 'translateY(0)',
            boxShadow: 'md',
          },
        }),
        ghost: {
          _hover: {
            bg: 'blackAlpha.50',
          },
        },
      },
      defaultProps: {
        colorScheme: 'brand',
      },
    },
    Card: {
      baseStyle: (props: any) => ({
        container: {
          bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
          borderRadius: 'xl',
          boxShadow: 'sm',
          borderWidth: '1px',
          borderColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.200',
          transition: 'all 0.2s',
          _hover: {
            transform: 'translateY(-2px)',
            boxShadow: 'md',
          },
        },
      }),
    },
    Heading: {
      baseStyle: {
        fontWeight: 'bold',
        letterSpacing: '-0.02em',
      },
    },
    Input: {
      variants: {
        filled: (props: any) => ({
          field: {
            bg: props.colorMode === 'dark' ? 'gray.700' : 'gray.100',
            _hover: {
              bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
            },
            _focus: {
              bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
              borderColor: 'brand.500',
            },
          },
        }),
      },
      defaultProps: {
        variant: 'filled',
      },
    },
    Select: {
      variants: {
        filled: (props: any) => ({
          field: {
            bg: props.colorMode === 'dark' ? 'gray.700' : 'gray.100',
            _hover: {
              bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
            },
            _focus: {
              bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
              borderColor: 'brand.500',
            },
          },
        }),
      },
      defaultProps: {
        variant: 'filled',
      },
    },
    Tabs: {
      variants: {
        enclosed: {
          tab: {
            _selected: {
              color: 'brand.600',
              borderColor: 'inherit',
              borderTopColor: 'brand.500',
              borderTopWidth: '2px',
              marginTop: '-1px',
            },
          },
        },
      },
    },
    Modal: {
      baseStyle: (props: any) => ({
        dialog: {
          bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
          borderRadius: 'xl',
        },
      }),
    },
  },
  layerStyles: {
    card: {
      bg: 'white',
      borderRadius: 'xl',
      boxShadow: 'sm',
      borderWidth: '1px',
      borderColor: 'gray.200',
      transition: 'all 0.2s',
      _hover: {
        transform: 'translateY(-2px)',
        boxShadow: 'md',
      },
    },
    gradientBg: {
      bgGradient: 'linear(to-r, brand.500, ocean.500)',
      color: 'white',
    },
  },
  textStyles: {
    h1: {
      fontSize: ['4xl', '5xl'],
      fontWeight: 'bold',
      lineHeight: '110%',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: ['3xl', '4xl'],
      fontWeight: 'bold',
      lineHeight: '110%',
      letterSpacing: '-0.02em',
    },
    h3: {
      fontSize: ['2xl', '3xl'],
      fontWeight: 'bold',
      lineHeight: '110%',
      letterSpacing: '-0.02em',
    },
  },
});

export default theme;