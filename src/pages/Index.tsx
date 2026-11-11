import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Brain, Sparkles, BookOpen, Type, Volume2, FileText, Upload, Mail, Phone, AlertCircle, Check, ClipboardCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { AccessibilityToolbar } from "@/components/AccessibilityToolbar";
import { TextToSpeech } from "@/components/TextToSpeech";
import { SpeechToText } from "@/components/SpeechToText";
import { ConfidenceGauge } from "@/components/ConfidenceGauge";
import { ImageUpload } from "@/components/ImageUpload";
import { analyzeText, AnalysisResult } from "@/lib/analyzeText";
import { useToast } from "@/hooks/use-toast";


const DEMO_REFERENCE_TEXT = "The quick brown fox jumps over the lazy dog. Reading can be challenging for some people, but with the right tools and support, everyone can improve their reading skills. This is an example text that might show some patterns.";

const Index = () => {
  const [referenceText, setReferenceText] = useState("");
  const [userText, setUserText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!referenceText.trim() || referenceText.trim().length < 30) {
      toast({
        title: "Reference Text Required",
        description: "Please enter reference text (at least 30 characters).",
        variant: "destructive"
      });
      return;
    }

    if (!userText.trim() || userText.trim().length < 20) {
      toast({
        title: "User Text Required",
        description: "Please type the text in the workspace (at least 20 characters).",
        variant: "destructive"
      });
      return;
    }
    
    setIsAnalyzing(true);
    setShowResults(false);
    
    try {
      const analysisResult = await analyzeText(userText, 'guest', referenceText);
      setResult(analysisResult);
      setShowResults(true);
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze text. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDemoText = () => {
    setReferenceText(DEMO_REFERENCE_TEXT);
  };

  const handleFontChange = (font: string) => {
    if (font === 'opendyslexic') {
      document.body.classList.add('dyslexic-font');
    } else {
      document.body.classList.remove('dyslexic-font');
    }
  };

  const handleLineHeightChange = (height: number) => {
    setLineHeight(height);
    document.documentElement.style.setProperty('--text-line-height', height.toString());
  };

  const handleLetterSpacingChange = (spacing: number) => {
    setLetterSpacing(spacing);
    document.documentElement.style.setProperty('--text-letter-spacing', `${spacing}px`);
  };

  const handleContrastToggle = (highContrast: boolean) => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  };

  const handleTranscript = (transcriptText: string) => {
    setUserText(transcriptText);
  };

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'Normal': return 'bg-success text-success-foreground';
      case 'Mild': return 'bg-primary text-primary-foreground';
      case 'Moderate': return 'bg-secondary text-secondary-foreground';
      case 'Severe': return 'bg-destructive text-destructive-foreground';
      case 'Inconclusive': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getLabelDescription = (label: string) => {
    switch (label) {
      case 'Normal': 
        return 'Text analysis shows typical reading patterns. Continue with standard reading strategies.';
      case 'Mild': 
        return 'Some indicators suggest mild reading challenges. Adaptive tools may be helpful.';
      case 'Moderate': 
        return 'Multiple indicators suggest moderate reading challenges. Recommended to use adaptive tools and consider professional consultation.';
      case 'Severe': 
        return 'Strong indicators of reading challenges detected. Strongly recommended to consult with a reading specialist or educational professional.';
      case 'Inconclusive': 
        return 'The analysis is inconclusive. Please try with a longer text sample (100+ words) for better accuracy.';
      default: 
        return '';
    }
  };

  useEffect(() => {
    const textElements = document.querySelectorAll('.adaptive-text');
    textElements.forEach((el) => {
      (el as HTMLElement).style.lineHeight = lineHeight.toString();
      (el as HTMLElement).style.letterSpacing = `${letterSpacing}px`;
    });
  }, [lineHeight, letterSpacing]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/favicon.svg" alt="IntelliRead logo" className="w-9 h-9" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">IntelliRead</h1>
                <p className="text-sm text-muted-foreground">Empowering Dyslexic Readers through AI</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/evaluation">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" />
                  Evaluation
                </Button>
              </Link>
              <Badge variant="outline" className="flex items-center gap-1">
                Guest Mode
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Introduction Section */}
        <section className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Screening Tool</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Making Reading Accessible
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-6 adaptive-text">
            IntelliRead helps identify dyslexia indicators by comparing reference text with user typing. 
          </p>

          <Card className="p-4 bg-primary/5 border-primary/20 max-w-2xl mx-auto">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              How This Works
            </h3>
            <ul className="text-sm text-muted-foreground text-left space-y-1">
              <li>• Paste reference text in the top box (what should be typed)</li>
              <li>• User types it out in the workspace below</li>
              <li>• Our AI compares both and detects dyslexia patterns</li>
              <li>• Get a prediction score and personalized recommendations</li>
            </ul>
          </Card>
        </section>

        {/* Reference Text Section */}
        <Card className="p-6 shadow-card border-2 mb-6 transition-smooth hover:shadow-glow bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="reference-text" className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Reference Text
            </label>
            <Button
              onClick={handleDemoText}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              Load Sample
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">
            Paste or type the text that the user should copy below
          </p>

          <Textarea
            id="reference-text"
            placeholder="Paste reference text here... (Example: The quick brown fox jumps over the lazy dog...)"
            value={referenceText}
            onChange={(e) => setReferenceText(e.target.value)}
            className="min-h-[120px] text-base resize-none border-2 focus:border-primary transition-smooth bg-background adaptive-text"
          />
          
          {referenceText && (
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {referenceText.trim().split(/\s+/).length} words
              </span>
              <span>•</span>
              <span>{referenceText.length} characters</span>
            </div>
          )}
        </Card>

        {/* User Workspace Section */}
        <Card className="p-8 shadow-card gradient-card border-2 mb-8 transition-smooth hover:shadow-glow" data-testid="input-card">
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="user-text" className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Type className="w-5 h-5 text-secondary" />
              User Workspace
            </label>
            <ImageUpload onTextExtracted={setUserText} />
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">
            Type out the reference text above as accurately as you can
          </p>

          <Textarea
            id="user-text"
            placeholder="Start typing the reference text here..."
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            className="min-h-[200px] text-base resize-none border-2 focus:border-secondary transition-smooth bg-background/50 adaptive-text"
            data-testid="text-input"
          />
          
          {userText && (
            <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {userText.trim().split(/\s+/).length} words
              </span>
              <span>•</span>
              <span>{userText.length} characters</span>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-3">Or use voice input:</p>
            <SpeechToText onTranscript={handleTranscript} />
          </div>
          
          <Button
            onClick={handleAnalyze}
            disabled={!referenceText.trim() || !userText.trim() || referenceText.trim().length < 30 || userText.trim().length < 20 || isAnalyzing}
            className="w-full mt-6 h-12 text-lg font-semibold gradient-primary hover:shadow-glow transition-smooth"
            size="lg"
            data-testid="analyze-button"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Comparing & Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5 mr-2" />
                Analyze for Dyslexia Patterns
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground mt-3 text-center">
            This screening compares your typing with the reference text. For clinical diagnosis, consult a specialist.
          </p>
        </Card>

        {/* Results Section */}
        {showResults && result && (
          <div className="space-y-6 animate-fade-in" data-testid="results-card">
            {/* Prediction Card */}
            <Card className={`p-6 shadow-card border-2 transition-smooth ${
              result.label === 'Normal' ? 'border-success bg-success/5' :
              result.label === 'Inconclusive' ? 'border-muted bg-muted/5' :
              'border-primary bg-primary/5'
            }`}>
              <h3 className="text-lg font-semibold mb-4 text-foreground">Analysis Result</h3>
              
              <div className="flex items-center gap-3 mb-4">
                <Badge className={`${getLabelColor(result.label)} text-base px-4 py-2`}>
                  {result.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {result.probability !== undefined && `Probability: ${(result.probability * 100).toFixed(0)}%`}
                </span>
                {result.engine && (
                  <Badge variant="outline">Score: rule-based</Badge>
                )}
                {result.recommendationsSource === 'gemini' && (
                  <Badge variant="outline">Recommendations: Gemini AI</Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-4 adaptive-text">
                {getLabelDescription(result.label)}
              </p>
              {result.fallbackReason && (
                <p className="text-xs text-muted-foreground mb-4">
                  Gemini did not write the recommendations: {result.fallbackReason}. Built-in recommendations are shown instead.
                </p>
              )}
              
              {result.probability !== undefined && (
                <ConfidenceGauge confidence={Math.round(result.probability * 100)} />
              )}
            </Card>

            {/* Annotations */}
            {result.annotations && result.annotations.length > 0 && (
              <Card className="p-6 shadow-card border-2 gradient-card">
                <h3 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-secondary" />
                  Pattern Analysis
                </h3>
                
                <div className="space-y-3">
                  {result.annotations.map((annotation, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border border-border bg-background/50 hover:border-primary transition-smooth`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`word-highlight annotation-${annotation.type}`}>
                              "{annotation.word}"
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {annotation.type}
                            </Badge>
                          </div>
                          {annotation.suggestion && annotation.suggestion !== annotation.word && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Check className="w-3 h-3 text-success" />
                              Suggestion: <span className="font-medium">{annotation.suggestion}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Personalized Suggestions */}
            {result.suggestions && result.suggestions.length > 0 && (
              <Card className="p-6 shadow-card border-2 gradient-card">
                <h3 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-accent" />
                  Personalized Recommendations
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {result.suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 p-4 rounded-lg bg-background/50 border border-border hover:border-primary transition-smooth"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </div>
                      <p className="text-sm text-foreground adaptive-text">{suggestion}</p>
                    </div>
                  ))}
                </div>

                {/* Text-to-Speech Preview */}
                <div className="pt-4 border-t border-border/50">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Text-to-Speech Preview
                  </h4>
                  <TextToSpeech text={referenceText} />
                </div>
              </Card>
            )}

            {/* Privacy Notice */}
            <Card className="p-4 bg-primary/5 border-primary/20">
              <p className="text-sm text-muted-foreground text-center">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Your text is analyzed for screening purposes only. No data is stored without your consent.
              </p>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="grid md:grid-cols-3 gap-8 mb-6">
            {/* Team */}
            <div>
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                Team
              </h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Suyash Sutar</p>
                <p>Alen Varghese</p>
              </div>
            </div>
            
            {/* Contact */}
            <div>
              <h4 className="font-semibold text-foreground mb-3">Contact Us</h4>
              <div className="space-y-2 text-sm">
                <a href="mailto:intelliread@example.com" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-smooth">
                  <Mail className="w-4 h-4" />
                  intelliread@example.com
                </a>
                <a href="tel:+1234567890" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-smooth">
                  <Phone className="w-4 h-4" />
                  +1 (234) 567-890
                </a>
              </div>
            </div>
            
            {/* About */}
            <div>
              <h4 className="font-semibold text-foreground mb-3">About IntelliRead</h4>
              <p className="text-sm text-muted-foreground">
                Empowering individuals with dyslexia through AI-powered reading analysis and adaptive learning tools.
              </p>
            </div>
          </div>
          
          <div className="border-t border-border/50 pt-6">
            <p className="text-center text-sm text-muted-foreground">
              © 2026 IntelliRead. Designed to make reading easier for everyone.
            </p>
          </div>
        </div>
      </footer>

      {/* Accessibility Toolbar */}
      <AccessibilityToolbar
        onFontChange={handleFontChange}
        onLineHeightChange={handleLineHeightChange}
        onLetterSpacingChange={handleLetterSpacingChange}
        onContrastToggle={handleContrastToggle}
      />
    </div>
  );
};

export default Index;
