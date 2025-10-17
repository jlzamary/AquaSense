import { Flex, Button, useColorMode, Box, IconButton, useDisclosure, Container, Heading, HStack, useColorModeValue, Menu, MenuButton, MenuList, MenuItem, Avatar, Stack, Text } from '@chakra-ui/react';
import { MoonIcon, SunIcon, HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  };

  return (
    <Box 
      borderBottom="1px" 
      borderColor={borderColor} 
      bg={bg} 
      position="sticky" 
      top={0} 
      zIndex={10}
      backdropFilter="blur(10px)"
      backgroundColor={useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')}
      boxShadow="sm"
    >
      <Container maxW={{ base: "100%", md: "90%", lg: "1400px" }} px={{ base: 4, md: 6, lg: 8 }}>
        <Flex h={20} alignItems="center" justifyContent="space-between">
          <HStack spacing={8} alignItems="center">
            <Heading 
              as={RouterLink} 
              to="/" 
              size="lg" 
              bgGradient="linear(to-r, brand.500, ocean.500)"
              bgClip="text"
              fontWeight="extrabold"
            >
              AquaSense
            </Heading>
            <HStack as="nav" spacing={2} display={{ base: 'none', md: 'flex' }}>
              {!currentUser && (
                <Button 
                  as={RouterLink} 
                  to="/" 
                  variant="ghost"
                  px={4}
                  fontSize="sm"
                  fontWeight="medium"
                  _hover={{ bg: 'blackAlpha.50' }}
                  _active={{ bg: 'blackAlpha.100' }}
                >
                  Home
                </Button>
              )}
              {currentUser && (
                <>
                  <Button 
                    as={RouterLink} 
                    to="/dashboard" 
                    variant="ghost"
                    px={4}
                    fontSize="sm"
                    fontWeight="medium"
                    _hover={{ bg: 'blackAlpha.50' }}
                    _active={{ bg: 'blackAlpha.100' }}
                  >
                    Dashboard
                  </Button>
                  <Button 
                    as={RouterLink} 
                    to="/analysis" 
                    variant="ghost"
                    px={4}
                    fontSize="sm"
                    fontWeight="medium"
                    _hover={{ bg: 'blackAlpha.50' }}
                    _active={{ bg: 'blackAlpha.100' }}
                  >
                    Analysis
                  </Button>
                  <Button 
                    as={RouterLink} 
                    to="/metrics" 
                    variant="ghost"
                    px={4}
                    fontSize="sm"
                    fontWeight="medium"
                    _hover={{ bg: 'blackAlpha.50' }}
                    _active={{ bg: 'blackAlpha.100' }}
                  >
                    Metrics
                  </Button>
                </>
              )}
            </HStack>
          </HStack>

          <HStack spacing={3}>
            <IconButton
              size="md"
              fontSize="lg"
              variant="ghost"
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              rounded="lg"
              _hover={{ bg: 'blackAlpha.50' }}
              _active={{ bg: 'blackAlpha.100' }}
            />
            
            {currentUser ? (
              <Menu>
                <MenuButton
                  as={Button}
                  rounded="lg"
                  variant="ghost"
                  cursor="pointer"
                  minW={0}
                  px={2}
                  _hover={{ bg: 'blackAlpha.50' }}
                  _active={{ bg: 'blackAlpha.100' }}
                >
                  <HStack spacing={2}>
                    <Avatar
                      size="sm"
                      name={currentUser.displayName || currentUser.email || ''}
                      src={currentUser.photoURL || ''}
                    />
                    <Box display={{ base: 'none', md: 'block' }}>
                      <Text fontSize="sm" fontWeight="medium" textAlign="left">
                        {currentUser.displayName || currentUser.email?.split('@')[0] || ''}
                      </Text>
                    </Box>
                  </HStack>
                </MenuButton>
                <MenuList 
                  py={2}
                  shadow="lg"
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <MenuItem 
                    onClick={() => navigate('/dashboard')}
                    fontSize="sm"
                    fontWeight="medium"
                    py={2}
                    px={4}
                  >
                    Dashboard
                  </MenuItem>
                  <MenuItem 
                    onClick={handleSignOut}
                    fontSize="sm"
                    fontWeight="medium"
                    color="red.500"
                    py={2}
                    px={4}
                  >
                    Sign out
                  </MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <>
                <Button 
                  as={RouterLink} 
                  to="/login" 
                  variant="ghost"
                  display={{ base: 'none', md: 'inline-flex' }}
                  fontSize="sm"
                  fontWeight="medium"
                  _hover={{ bg: 'blackAlpha.50' }}
                  _active={{ bg: 'blackAlpha.100' }}
                >
                  Sign In
                </Button>
                <Button 
                  as={RouterLink} 
                  to="/signup" 
                  colorScheme="brand"
                  display={{ base: 'none', md: 'inline-flex' }}
                  fontSize="sm"
                  fontWeight="medium"
                >
                  Sign Up
                </Button>
              </>
            )}

            <IconButton
              display={{ base: 'flex', md: 'none' }}
              onClick={isOpen ? onClose : onOpen}
              icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
              variant="ghost"
              aria-label="Toggle Navigation"
              rounded="lg"
              _hover={{ bg: 'blackAlpha.50' }}
              _active={{ bg: 'blackAlpha.100' }}
            />
          </HStack>
        </Flex>

        {/* Mobile menu */}
        {isOpen && (
          <Box 
            pb={4} 
            display={{ md: 'none' }}
            borderTop="1px"
            borderColor={borderColor}
            mt={2}
          >
            <Stack as="nav" spacing={2} pt={4}>
              {!currentUser && (
                <Button 
                  as={RouterLink} 
                  to="/" 
                  variant="ghost" 
                  justifyContent="start" 
                  w="full"
                  fontSize="sm"
                  fontWeight="medium"
                  height={12}
                >
                  Home
                </Button>
              )}
              {currentUser ? (
                <>
                  <Button 
                    as={RouterLink} 
                    to="/dashboard" 
                    variant="ghost" 
                    justifyContent="start" 
                    w="full"
                    fontSize="sm"
                    fontWeight="medium"
                    height={12}
                  >
                    Dashboard
                  </Button>
                  <Button 
                    as={RouterLink} 
                    to="/analysis" 
                    variant="ghost" 
                    justifyContent="start" 
                    w="full"
                    fontSize="sm"
                    fontWeight="medium"
                    height={12}
                  >
                    Analysis
                  </Button>
                  <Button 
                    as={RouterLink} 
                    to="/metrics" 
                    variant="ghost" 
                    justifyContent="start" 
                    w="full"
                    fontSize="sm"
                    fontWeight="medium"
                    height={12}
                  >
                    Metrics
                  </Button>
                  <Button 
                    variant="ghost" 
                    justifyContent="start" 
                    w="full" 
                    onClick={handleSignOut}
                    fontSize="sm"
                    fontWeight="medium"
                    height={12}
                    color="red.500"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    as={RouterLink} 
                    to="/login" 
                    variant="ghost" 
                    justifyContent="start" 
                    w="full"
                    fontSize="sm"
                    fontWeight="medium"
                    height={12}
                  >
                    Sign In
                  </Button>
                  <Button 
                    as={RouterLink} 
                    to="/signup" 
                    colorScheme="brand" 
                    w="full" 
                    justifyContent="start"
                    fontSize="sm"
                    fontWeight="medium"
                    height={12}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </Stack>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Navbar;
