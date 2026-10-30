import { useParams } from 'react-router-dom';
import ComingSoon from './ComingSoon';

export default function ProblemPage() {
  const { slug } = useParams();
  return (
    <ComingSoon title={`Problem: ${slug ?? ''}`} blurb="This problem is still being cooked." />
  );
}
