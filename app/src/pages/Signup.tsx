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
  Text, 
  Link, 
  useToast,
  Heading,
  Container,
  useColorModeValue,
  Checkbox,
  Stack
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const bg = useColorModeValue('white', 'gray.700');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!agreedToTerms) {
      toast({
        title: 'Error',
        description: 'You must agree to the Terms of Service and Privacy Policy',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsLoading(true);
      await signUp(email, password, name);
      toast({
        title: 'Success',
        description: 'Account created successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create account. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.sm" py={20}>
      <Box
        p={8}
        borderWidth={1}
        borderRadius={8}
        boxShadow="lg"
        bg={bg}
      >
        <VStack spacing={4} align="stretch">
          <Box textAlign="center">
            <Heading as="h1" size="xl" mb={2}>
              Create an Account
            </Heading>
            <Text color="gray.500">Join our community of marine researchers</Text>
          </Box>
          
          <form onSubmit={handleSubmit}>
            <VStack spacing={6}>
              <FormControl id="name" isRequired>
                <FormLabel>Full Name</FormLabel>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  size="lg"
                />
              </FormControl>
              
              <FormControl id="email" isRequired>
                <FormLabel>Email address</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  size="lg"
                />
              </FormControl>
              
              <FormControl id="password" isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup size="lg">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                  />
                  <InputRightElement h="full">
                    <Button
                      variant="ghost"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Must be at least 8 characters
                </Text>
              </FormControl>
              
              <FormControl id="confirmPassword" isRequired>
                <FormLabel>Confirm Password</FormLabel>
                <InputGroup size="lg">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                  />
                  <InputRightElement h="full">
                    <Button
                      variant="ghost"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              
              <FormControl id="terms" isRequired>
                <Stack direction="row" spacing={4} align="flex-start">
                  <Checkbox
                    isChecked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    mt={1}
                  />
                  <Text fontSize="sm" color="gray.600">
                    I agree to the{' '}
                    <Link as={RouterLink} to="/terms" color="brand.500">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link as={RouterLink} to="/privacy" color="brand.500">
                      Privacy Policy
                    </Link>
                  </Text>
                </Stack>
              </FormControl>
              
              <Button
                type="submit"
                colorScheme="brand"
                size="lg"
                width="100%"
                isLoading={isLoading}
                loadingText="Creating account..."
              >
                Create Account
              </Button>
              
              <Text textAlign="center" mt={4}>
                Already have an account?{' '}
                <Link as={RouterLink} to="/login" color="brand.500" fontWeight="medium">
                  Sign in
                </Link>
              </Text>
            </VStack>
          </form>
        </VStack>
      </Box>
    </Container>
  );
};

export default Signup;
