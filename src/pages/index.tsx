import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  Select,
  Button,
  useToast,
  Text,
  Progress,
  Grid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';

interface AudioFile {
  name: string;
  path: string;
}

interface VideoInfo {
  id: string;
  filename: string;
  path: string;
  createdAt: string;
  status: 'completed' | 'failed';
  error?: string;
}

interface ProgressInfo {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  step: string;
  error?: string;
}

export default function Home() {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<string>('');
  const [videos, setVideos] = useState<VideoInfo[]>([]);
  const [currentProgress, setCurrentProgress] = useState<ProgressInfo | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchAudioFiles();
    fetchVideos();
  }, []);

  const fetchAudioFiles = async () => {
    try {
      const response = await fetch('/api/audio-files');
      const data = await response.json();
      setAudioFiles(data);
    } catch (error) {
      setError('音声ファイルの取得に失敗しました');
      toast({
        title: 'エラー',
        description: '音声ファイルの取得に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos');
      const data = await response.json();
      setVideos(data);
    } catch (error) {
      setError('動画一覧の取得に失敗しました');
    }
  };

  const handleGenerate = async () => {
    if (!selectedAudio) {
      toast({
        title: '警告',
        description: '音声ファイルを選択してください',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioPath: selectedAudio }),
      });

      if (!response.ok) throw new Error('動画生成に失敗しました');

      const { id } = await response.json();
      pollProgress(id);

      toast({
        title: '成功',
        description: '動画の生成を開始しました',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      setError('動画生成に失敗しました');
      toast({
        title: 'エラー',
        description: '動画生成に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const pollProgress = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/progress?id=${id}`);
        const data = await response.json();
        setCurrentProgress(data);

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval);
          fetchVideos(); // 動画一覧を更新
        }
      } catch (error) {
        console.error('Progress polling error:', error);
      }
    }, 1000);
  };

  const handleVideoClick = (video: VideoInfo) => {
    setSelectedVideo(video);
    onOpen();
  };

  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing="8" align="stretch">
        <Heading as="h1" size="xl" textAlign="center">
          動画生成管理画面
        </Heading>

        {error && (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>エラーが発生しました</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Box>
          <Text mb={2}>音声ファイルを選択</Text>
          <Select
            placeholder="音声ファイルを選択してください"
            value={selectedAudio}
            onChange={(e) => setSelectedAudio(e.target.value)}
          >
            {audioFiles.map((file) => (
              <option key={file.path} value={file.path}>
                {file.name}
              </option>
            ))}
          </Select>
        </Box>

        <Button
          colorScheme="blue"
          size="lg"
          onClick={handleGenerate}
          isDisabled={!selectedAudio}
        >
          動画を生成
        </Button>

        {currentProgress && (
          <Box>
            <Text mb={2}>
              進捗状況: {currentProgress.step} ({currentProgress.progress}%)
            </Text>
            <Progress
              value={currentProgress.progress}
              colorScheme={
                currentProgress.status === 'failed' ? 'red' : 'blue'
              }
            />
          </Box>
        )}

        <Box>
          <Heading as="h2" size="lg" mb={4}>
            生成済み動画一覧
          </Heading>
          <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
            {videos.map((video) => (
              <Box
                key={video.id}
                p={4}
                border="1px"
                borderColor="gray.200"
                borderRadius="md"
                cursor="pointer"
                onClick={() => handleVideoClick(video)}
              >
                <Text fontWeight="bold">{video.filename}</Text>
                <Text fontSize="sm" color="gray.500">
                  作成日時: {new Date(video.createdAt).toLocaleString()}
                </Text>
                <Text
                  fontSize="sm"
                  color={video.status === 'failed' ? 'red.500' : 'green.500'}
                >
                  ステータス: {video.status}
                </Text>
              </Box>
            ))}
          </Grid>
        </Box>

        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>動画プレビュー</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedVideo && (
                <Box>
                  <video
                    controls
                    width="100%"
                    src={selectedVideo.path}
                    style={{ maxHeight: '70vh' }}
                  />
                  <Text mt={2}>ファイル名: {selectedVideo.filename}</Text>
                  <Text>
                    作成日時:{' '}
                    {new Date(selectedVideo.createdAt).toLocaleString()}
                  </Text>
                </Box>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
} 