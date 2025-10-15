import { useState } from 'react';
import { 
  Box, 
  SimpleGrid, 
  Card, 
  CardBody, 
  CardFooter, 
  Heading, 
  Text, 
  VStack, 
  HStack, 
  Badge, 
  Input, 
  InputGroup, 
  InputLeftElement, 
  InputRightElement, 
  IconButton,
  useColorModeValue,
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Divider,
  Link,
  Tooltip
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { FaFish, FaInfoCircle, FaGlobeAmericas } from 'react-icons/fa';
import { SiWikipedia } from 'react-icons/si';

interface Species {
  id: string;
  commonName: string;
  scientificName: string;
  description: string;
  habitat: string;
  distribution: string;
  conservationStatus: string;
  imageUrl: string;
  category: 'mollusk' | 'fish' | 'crustacean' | 'other';
  wikipediaUrl?: string;
  iucnUrl?: string;
}

// Mock data - in a real app, this would come from your database
const speciesData: Species[] = [
  {
    id: 'scallop',
    commonName: 'Scallop',
    scientificName: 'Pectinidae',
    description: 'Scallops are marine bivalve mollusks of the family Pectinidae. They are known for their fan-shaped shells and the ability to swim by clapping their shells together.',
    habitat: 'Sandy or gravelly substrates in coastal waters',
    distribution: 'Worldwide in all oceans',
    conservationStatus: 'Varies by species',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Argopecten_irradians.jpg/800px-Argopecten_irradians.jpg',
    category: 'mollusk',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Scallop',
    iucnUrl: 'https://www.iucnredlist.org/search?query=scallop&searchType=species'
  },
  {
    id: 'atlantic-cod',
    commonName: 'Atlantic Cod',
    scientificName: 'Gadus morhua',
    description: 'The Atlantic cod is a benthopelagic fish of the family Gadidae, widely consumed by humans. It is known for its mild flavor and dense, flaky white flesh.',
    habitat: 'Cold, deep waters of the North Atlantic',
    distribution: 'North Atlantic Ocean',
    conservationStatus: 'Vulnerable',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Gadus_morhua_Cod-2b-Atlanterhavsparken-Norway.JPG/800px-Gadus_morhua_Cod-2b-Atlanterhavsparken-Norway.JPG',
    category: 'fish',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Atlantic_cod',
    iucnUrl: 'https://www.iucnredlist.org/species/8784/12931575'
  },
  {
    id: 'european-lobster',
    commonName: 'European Lobster',
    scientificName: 'Homarus gammarus',
    description: 'The European lobster is a species of clawed lobster from the eastern Atlantic Ocean, Mediterranean Sea and parts of the Black Sea.',
    habitat: 'Rocky substrates, from the shoreline to about 150m depth',
    distribution: 'Eastern Atlantic Ocean, Mediterranean Sea',
    conservationStatus: 'Least Concern',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Homarus_gammarus_%28mature_female%29.jpg/800px-Homarus_gammarus_%28mature_female%29.jpg',
    category: 'crustacean',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/European_lobster',
    iucnUrl: 'https://www.iucnredlist.org/species/169955/1287251'
  },
  {
    id: 'common-whelk',
    commonName: 'Common Whelk',
    scientificName: 'Buccinum undatum',
    description: 'A large, edible sea snail, a marine gastropod mollusc in the family Buccinidae, the true whelks.',
    habitat: 'Sandy and muddy bottoms from the low intertidal zone to about 100m depth',
    distribution: 'North Atlantic Ocean',
    conservationStatus: 'Least Concern',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Buccinum_undatum_01.jpg/800px-Buccinum_undatum_01.jpg',
    category: 'mollusk',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Common_whelk'
  },
  {
    id: 'thornback-ray',
    commonName: 'Thornback Ray',
    scientificName: 'Raja clavata',
    description: 'A species of ray fish in the family Rajidae. It is found in coastal waters of Europe and western Africa, typically in shallow waters.',
    habitat: 'Sandy or muddy bottoms in coastal waters',
    distribution: 'Eastern Atlantic Ocean, Mediterranean Sea',
    conservationStatus: 'Near Threatened',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Raja_clavata.jpg/800px-Raja_clavata.jpg',
    category: 'fish',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Thornback_ray',
    iucnUrl: 'https://www.iucnredlist.org/species/39399/10310767'
  },
  {
    id: 'european-plaice',
    commonName: 'European Plaice',
    scientificName: 'Pleuronectes platessa',
    description: 'A commercially important flatfish in the family Pleuronectidae. It is a right-eyed flounder, living on the sandy bottoms of the European shelf.',
    habitat: 'Sandy and muddy bottoms from shallow waters to about 200m depth',
    distribution: 'Northeastern Atlantic Ocean',
    conservationStatus: 'Least Concern',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Pleuronectes_platessa.jpg/800px-Pleuronectes_platessa.jpg',
    category: 'fish',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/European_plaice'
  },
  {
    id: 'european-conger',
    commonName: 'European Conger',
    scientificName: 'Conger conger',
    description: 'A species of conger of the family Congridae. It is the heaviest eel in the world and native to the northeast Atlantic, including the Mediterranean Sea.',
    habitat: 'Rocky shores, estuaries, and deeper waters',
    distribution: 'Northeastern Atlantic Ocean, Mediterranean Sea',
    conservationStatus: 'Least Concern',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Conger_conger.jpg/800px-Conger_conger.jpg',
    category: 'fish',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/European_conger'
  }
];

const Species = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeTab, setActiveTab] = useState(0);
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const filteredSpecies = speciesData.filter(species => 
    species.commonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    species.scientificName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    species.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const mollusks = filteredSpecies.filter(s => s.category === 'mollusk');
  const fish = filteredSpecies.filter(s => s.category === 'fish');
  const crustaceans = filteredSpecies.filter(s => s.category === 'crustacean');
  const others = filteredSpecies.filter(s => s.category === 'other');
  
  const handleSpeciesClick = (species: Species) => {
    setSelectedSpecies(species);
    onOpen();
  };
  
  const getConservationStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'least concern':
        return 'green';
      case 'near threatened':
        return 'yellow';
      case 'vulnerable':
        return 'orange';
      case 'endangered':
        return 'red';
      case 'critically endangered':
        return 'red';
      case 'extinct in the wild':
        return 'purple';
      default:
        return 'gray';
    }
  };
  
  const getCategorySpecies = (category: string) => {
    switch (category) {
      case 'mollusk':
        return mollusks;
      case 'fish':
        return fish;
      case 'crustacean':
        return crustaceans;
      case 'other':
        return others;
      default:
        return [];
    }
  };
  
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'mollusk':
        return 'Mollusks';
      case 'fish':
        return 'Fish';
      case 'crustacean':
        return 'Crustaceans';
      case 'other':
        return 'Other Species';
      default:
        return category;
    }
  };

  return (
    <Box>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="xl" mb={2}>Benthic Species Database</Heading>
          <Text color="gray.500">
            Explore and learn about the benthic species our AI can identify. Click on any species for more information.
          </Text>
        </Box>
        
        {/* Search Bar */}
        <Box>
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              pr="4.5rem"
            />
            {searchTerm && (
              <InputRightElement>
                <IconButton
                  aria-label="Clear search"
                  icon={<CloseIcon />}
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                />
              </InputRightElement>
            )}
          </InputGroup>
        </Box>
        
        {/* Species Grid with Tabs */}
        <Tabs variant="enclosed" onChange={(index) => setActiveTab(index)}>
          <TabList mb={6} overflowX="auto" overflowY="hidden">
            <Tab>All Species ({filteredSpecies.length})</Tab>
            <Tab>Fish ({fish.length})</Tab>
            <Tab>Mollusks ({mollusks.length})</Tab>
            <Tab>Crustaceans ({crustaceans.length})</Tab>
            {others.length > 0 && <Tab>Other ({others.length})</Tab>}
          </TabList>
          
          <TabPanels>
            {/* All Species */}
            <TabPanel p={0}>
              {filteredSpecies.length > 0 ? (
                <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing={6}>
                  {filteredSpecies.map((species) => (
                    <SpeciesCard 
                      key={species.id} 
                      species={species} 
                      onClick={handleSpeciesClick}
                      bg={cardBg}
                      borderColor={borderColor}
                    />
                  ))}
                </SimpleGrid>
              ) : (
                <Box textAlign="center" py={10}>
                  <Icon as={FaFish} boxSize={10} color="gray.400" mb={4} />
                  <Text fontSize="lg" color="gray.500">
                    No species found matching "{searchTerm}". Try a different search term.
                  </Text>
                </Box>
              )}
            </TabPanel>
            
            {/* Individual Category Tabs */}
            {['fish', 'mollusk', 'crustacean', 'other'].map((category) => (
              <TabPanel key={category} p={0}>
                {getCategorySpecies(category).length > 0 ? (
                  <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing={6}>
                    {getCategorySpecies(category).map((species) => (
                      <SpeciesCard 
                        key={species.id} 
                        species={species} 
                        onClick={handleSpeciesClick}
                        bg={cardBg}
                        borderColor={borderColor}
                      />
                    ))}
                  </SimpleGrid>
                ) : (
                  <Box textAlign="center" py={10}>
                    <Icon as={FaFish} boxSize={10} color="gray.400" mb={4} />
                    <Text fontSize="lg" color="gray.500">
                      No {getCategoryName(category).toLowerCase()} found{searchTerm ? ` matching "${searchTerm}"` : ''}.
                    </Text>
                  </Box>
                )}
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </VStack>
      
      {/* Species Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size={{ base: 'full', md: '2xl' }} isCentered>
        <ModalOverlay />
        <ModalContent>
          {selectedSpecies && (
            <>
              <ModalHeader>
                <HStack spacing={2} align="center">
                  <Text>{selectedSpecies.commonName}</Text>
                  <Badge 
                    colorScheme={getConservationStatusColor(selectedSpecies.conservationStatus)}
                    fontSize="0.7em"
                  >
                    {selectedSpecies.conservationStatus}
                  </Badge>
                </HStack>
                <Text fontSize="md" fontWeight="normal" color="gray.500">
                  {selectedSpecies.scientificName}
                </Text>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack spacing={6} align="stretch">
                  <Box 
                    h="200px" 
                    bg="gray.100" 
                    borderRadius="md" 
                    overflow="hidden"
                    backgroundImage={`url(${selectedSpecies.imageUrl})`}
                    backgroundSize="cover"
                    backgroundPosition="center"
                  />
                  
                  <Box>
                    <Heading size="md" mb={3}>Description</Heading>
                    <Text>{selectedSpecies.description}</Text>
                  </Box>
                  
                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={6}>
                    <Box>
                      <Heading size="sm" mb={2}>Habitat</Heading>
                      <Text color="gray.600">{selectedSpecies.habitat}</Text>
                    </Box>
                    <Box>
                      <Heading size="sm" mb={2}>Distribution</Heading>
                      <Text color="gray.600">{selectedSpecies.distribution}</Text>
                    </Box>
                  </SimpleGrid>
                  
                  <Divider my={2} />
                  
                  <HStack spacing={4} justify="flex-end">
                    {selectedSpecies.wikipediaUrl && (
                      <Tooltip label="View on Wikipedia" hasArrow>
                        <IconButton
                          as="a"
                          href={selectedSpecies.wikipediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Wikipedia"
                          icon={<SiWikipedia />}
                          colorScheme="gray"
                          variant="outline"
                        />
                      </Tooltip>
                    )}
                    {selectedSpecies.iucnUrl && (
                      <Tooltip label="View on IUCN Red List" hasArrow>
                        <IconButton
                          as="a"
                          href={selectedSpecies.iucnUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="IUCN Red List"
                          icon={<FaGlobeAmericas />}
                          colorScheme="red"
                          variant="outline"
                        />
                      </Tooltip>
                    )}
                  </HStack>
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button 
                  colorScheme="brand" 
                  mr={3} 
                  onClick={onClose}
                >
                  Close
                </Button>
                <Button 
                  variant="outline" 
                  as="a"
                  href={`/analysis`}
                  leftIcon={<FaImage />}
                >
                  Identify this species
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Box>
  );
};

interface SpeciesCardProps {
  species: Species;
  onClick: (species: Species) => void;
  bg: string;
  borderColor: string;
}

const SpeciesCard = ({ species, onClick, bg, borderColor }: SpeciesCardProps) => {
  const getConservationStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'least concern':
        return 'green';
      case 'near threatened':
        return 'yellow';
      case 'vulnerable':
        return 'orange';
      case 'endangered':
        return 'red';
      case 'critically endangered':
        return 'red';
      case 'extinct in the wild':
        return 'purple';
      default:
        return 'gray';
    }
  };

  return (
    <Card 
      onClick={() => onClick(species)}
      cursor="pointer"
      _hover={{ 
        transform: 'translateY(-4px)',
        shadow: 'md',
        borderColor: 'brand.300'
      }}
      transition="all 0.2s"
      borderWidth="1px"
      borderColor={borderColor}
      bg={bg}
      h="100%"
      display="flex"
      flexDirection="column"
    >
      <Box 
        h="140px" 
        bg="gray.100" 
        backgroundImage={`url(${species.imageUrl})`}
        backgroundSize="cover"
        backgroundPosition="center"
        borderTopRadius="md"
      />
      <CardBody flexGrow={1}>
        <HStack spacing={2} mb={1} align="center">
          <Heading size="md">{species.commonName}</Heading>
          <Badge 
            colorScheme={getConservationStatusColor(species.conservationStatus)}
            fontSize="0.6em"
            px={2}
            py={0.5}
            borderRadius="full"
          >
            {species.conservationStatus}
          </Badge>
        </HStack>
        <Text fontSize="sm" color="gray.500" fontStyle="italic" mb={2}>
          {species.scientificName}
        </Text>
        <Text fontSize="sm" noOfLines={3}>
          {species.description}
        </Text>
      </CardBody>
      <CardFooter pt={0}>
        <Button 
          size="sm" 
          variant="outline" 
          colorScheme="brand"
          rightIcon={<FaInfoCircle />}
          w="full"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Species;
