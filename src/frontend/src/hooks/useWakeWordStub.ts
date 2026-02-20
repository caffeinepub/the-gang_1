// TODO: Inject @picovoice/porcupine-react logic here to trigger the SpeechRecognition automatically.

// import { usePorcupine } from '@picovoice/porcupine-react';
//
// export function useWakeWordStub(onWakeWordDetected: () => void) {
//   const {
//     keywordDetection,
//     isLoaded,
//     isListening,
//     error,
//     init,
//     start,
//     stop,
//     release,
//   } = usePorcupine();
//
//   useEffect(() => {
//     if (keywordDetection !== null) {
//       // Wake word detected
//       onWakeWordDetected();
//     }
//   }, [keywordDetection, onWakeWordDetected]);
//
//   return {
//     isLoaded,
//     isListening,
//     error,
//     init,
//     start,
//     stop,
//     release,
//   };
// }
