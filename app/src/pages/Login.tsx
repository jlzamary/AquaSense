import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
  HStack,
  Text,
  Link,
  useToast,
  Heading,
  useColorModeValue,
  Divider,
  Icon
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { FaGoogle } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const bg = useColorModeValue('white', 'gray.800');
  const bgGradient = useColorModeValue('linear(to-b, brand.50, white)', 'linear(to-b, gray.900, gray.800)');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'white');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Error', description: 'Please fill in all fields', status: 'error', duration: 5000, isClosable: true });
      return;
    }
    try {
      setIsLoading(true);
      await signIn(email, password);
      toast({ title: 'Success', description: 'Successfully logged in!', status: 'success', duration: 3000, isClosable: true });
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to log in. Please check your credentials.', status: 'error', duration: 5000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      await signInWithGoogle();
      toast({ title: 'Success', description: 'Successfully logged in with Google!', status: 'success', duration: 3000, isClosable: true });
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Google Sign-in error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to sign in with Google.', status: 'error', duration: 5000, isClosable: true });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Box w="100vw" minH="100dvh" bg={bgGradient} m={0}>
      <Box display="flex" alignItems="center" justifyContent="center" minH="inherit" px={4} py={8}>
        {/* Card */}
        <Box
          maxW="md"
          w="100%"
          p={{ base: 6, md: 10 }}
          borderRadius="xl"
          bg={bg}
          boxShadow="2xl"
          position="relative"
          overflow="hidden"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            bgGradient: 'linear(to-r, brand.400, brand.600)',
          }}
        >
          <VStack spacing={8} align="stretch">
            <Box textAlign="center">
              <Heading as="h1" size="2xl" mb={3} color={headingColor} fontWeight="bold">
                Welcome Back
              </Heading>
              <Text color={textColor} fontSize="lg">Sign in to continue to AquaSense</Text>
            </Box>

            <Box as="form" onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <FormControl id="email" isRequired>
                  <FormLabel color={textColor} fontWeight="medium">Email</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    size="lg"
                    bg={useColorModeValue('white', 'gray.700')}
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                    _hover={{ borderColor: 'brand.300' }}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    px={4}
                    py={6}
                  />
                </FormControl>

                <FormControl id="password" isRequired>
                  <FormLabel color={textColor} fontWeight="medium">Password</FormLabel>
                  <InputGroup size="lg">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      bg={useColorModeValue('white', 'gray.700')}
                      borderColor={useColorModeValue('gray.200', 'gray.600')}
                      _hover={{ borderColor: 'brand.300' }}
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                      px={4}
                      py={6}
                    />
                    <InputRightElement h="full" mr={1}>
                      <Button
                        variant="ghost"
                        onClick={() => setShowPassword(!showPassword)}
                        color={textColor}
                        _hover={{ bg: 'transparent', color: 'brand.500' }}
                        _active={{ bg: 'transparent' }}
                      >
                        {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                  <Box textAlign="right" mt={2}>
                    <Link
                      as={RouterLink}
                      to="/forgot-password"
                      color="brand.500"
                      fontSize="sm"
                      fontWeight="medium"
                      _hover={{ textDecoration: 'underline', color: 'brand.600' }}
                    >
                      Forgot password?
                    </Link>
                  </Box>
                </FormControl>

                <Button
                  colorScheme="brand"
                  size="lg"
                  type="submit"
                  width="full"
                  isLoading={isLoading}
                  loadingText="Signing in..."
                  py={6}
                  fontSize="md"
                  fontWeight="semibold"
                  borderRadius="lg"
                  _active={{ transform: 'translateY(0)' }}
                  transition="all 0.2s"
                  bgGradient="linear(to-r, brand.400, brand.600)"
                  _hover={{
                    bgGradient: 'linear(to-r, brand.500, brand.700)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 20px -5px rgba(66, 153, 225, 0.4)'
                  }}
                >
                  Sign In
                </Button>

                <HStack my={4}>
                  <Divider />
                  <Text color={textColor} fontSize="sm" whiteSpace="nowrap">OR</Text>
                  <Divider />
                </HStack>

                <Button
                  variant="outline"
                  size="lg"
                  width="full"
                  leftIcon={<Icon as={FaGoogle} />}
                  onClick={handleGoogleSignIn}
                  isLoading={isGoogleLoading}
                  loadingText="Signing in..."
                  py={6}
                  fontSize="md"
                  fontWeight="semibold"
                  borderColor={useColorModeValue('gray.300', 'gray.600')}
                  _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                >
                  Sign in with Google
                </Button>

                <HStack spacing={1} justify="center" mt={4}>
                  <Text color={textColor}>Don't have an account?</Text>
                  <Link
                    as={RouterLink}
                    to="/signup"
                    color="brand.500"
                    fontWeight="semibold"
                    _hover={{ textDecoration: 'underline', color: 'brand.600' }}
                  >
                    Sign up
                  </Link>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
