import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, Play, ArrowLeft, FileText, Target, MapPin, 
  BarChart3, MessageSquare, RefreshCcw, AlertTriangle, CheckCircle2, Info
} from "lucide-react";
import { invokeFunction } from "@/lib/api";
import { Link } from "react-router-dom";

interface MetricDefinition {
  name: string;
  formula: string;
  unit: string;
  interpretation: string;
}

interface PatternResult {
  errorType: string;
  totalPatterns: number;
  correctlyDetected: number;
  detectionAccuracy: number;
  testCaseDetails: Array<{ id: string; injected: number; detected: number; accuracy: number }>;
}

interface LocalizationResult {
  errorType: string;
  totalPositions: number;
  correctlyLocalized: number;
  localizationAccuracy: number;
}

interface ConsistencyResult {
  groupId: string;
  errorType: string;
  variants: number;
  consistentDetections: number;
  consistencyRate: number;
}

interface ToolComparison {
  tool: string;
  errorReduction: string;
  readingSpeedImprovement: string;
  comprehensionScore: string;
}

interface ExplainabilitySample {
  errorType: string;
  errorWord: string;
  correctWord: string;
  explanation: string;
}

interface EvaluationReport {
  timestamp: string;
  framework: string;
  systemDescription: string;
  metricDefinitions: Record<string, MetricDefinition>;
  summary: {
    totalTestCases: number;
    totalInjectedErrors: number;
    overallDetectionAccuracy: number;
    overallLocalizationAccuracy: number;
    averageConsistencyRate: number;
    averageExplainabilityScore: number;
  };
  patternDetection: {
    title: string;
    description: string;
    results: PatternResult[];
    overallAccuracy: number;
  };
  localizationAccuracy: {
    title: string;
    description: string;
    results: LocalizationResult[];
    overallAccuracy: number;
  };
  baselineComparison: {
    title: string;
    description: string;
    note: string;
    toolComparison: ToolComparison[];
  };
  explainability: {
    title: string;
    description: string;
    scores: Record<string, { score: string; description: string }>;
    sampleExplanations: ExplainabilitySample[];
  };
  consistency: {
    title: string;
    description: string;
    results: ConsistencyResult[];
    averageConsistencyRate: number;
  };
  interpretation: {
    summary: string;
    strengths: string[];
    limitations: string[];
    recommendations: string[];
  };
  disclaimer: string;
}

export default function Evaluation() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runEvaluation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await invokeFunction('evaluation');
      if (error) throw error;
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run evaluation');
    } finally {
      setLoading(false);
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyBg = (accuracy: number) => {
    if (accuracy >= 80) return 'bg-green-500/10';
    if (accuracy >= 60) return 'bg-yellow-500/10';
    return 'bg-red-500/10';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Rule-Based Evaluation Framework</h1>
            <p className="text-muted-foreground">
              Comprehensive evaluation metrics for IntelliRead screening system
            </p>
          </div>
        </div>

        {/* Run Evaluation Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Run Evaluation Suite
            </CardTitle>
            <CardDescription>
              Execute all evaluation tests against synthetic test cases with known error patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={runEvaluation} disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Evaluation...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Evaluation
                </>
              )}
            </Button>
            
            {error && (
              <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {report && (
          <>
            {/* Metric Definitions Section */}
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Evaluation Metric Definitions
                </CardTitle>
                <CardDescription>
                  Formal definitions of all metrics used in this rule-based evaluation framework
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(report.metricDefinitions).map(([key, def]) => (
                    <div key={key} className="p-4 rounded-lg bg-background border">
                      <h4 className="font-semibold text-foreground mb-2">{def.name}</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Formula: </span>
                          <code className="bg-muted px-2 py-0.5 rounded text-xs">{def.formula}</code>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Unit: </span>
                          <span>{def.unit}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Interpretation: </span>
                          <span className="text-foreground">{def.interpretation}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Evaluation Summary</CardTitle>
                <CardDescription>
                  {report.framework} • Ran at {new Date(report.timestamp).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{report.summary.totalTestCases}</div>
                    <div className="text-xs text-muted-foreground">Test Cases</div>
                  </div>
                  <div className={`text-center p-4 rounded-lg ${getAccuracyBg(report.summary.overallDetectionAccuracy)}`}>
                    <div className={`text-2xl font-bold ${getAccuracyColor(report.summary.overallDetectionAccuracy)}`}>
                      {report.summary.overallDetectionAccuracy}%
                    </div>
                    <div className="text-xs text-muted-foreground">Detection Accuracy</div>
                  </div>
                  <div className={`text-center p-4 rounded-lg ${getAccuracyBg(report.summary.overallLocalizationAccuracy)}`}>
                    <div className={`text-2xl font-bold ${getAccuracyColor(report.summary.overallLocalizationAccuracy)}`}>
                      {report.summary.overallLocalizationAccuracy}%
                    </div>
                    <div className="text-xs text-muted-foreground">Localization Accuracy</div>
                  </div>
                  <div className={`text-center p-4 rounded-lg ${getAccuracyBg(report.summary.averageConsistencyRate)}`}>
                    <div className={`text-2xl font-bold ${getAccuracyColor(report.summary.averageConsistencyRate)}`}>
                      {report.summary.averageConsistencyRate}%
                    </div>
                    <div className="text-xs text-muted-foreground">Consistency Rate</div>
                  </div>
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {report.summary.averageExplainabilityScore}/5
                    </div>
                    <div className="text-xs text-muted-foreground">Explainability Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 1. Pattern Detection Accuracy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  {report.patternDetection.title}
                </CardTitle>
                <CardDescription>{report.patternDetection.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Error Type</th>
                        <th className="text-center py-3 px-4 font-semibold">Total Patterns</th>
                        <th className="text-center py-3 px-4 font-semibold">Correctly Detected</th>
                        <th className="text-center py-3 px-4 font-semibold">Detection Accuracy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.patternDetection.results.map((result) => (
                        <tr key={result.errorType} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{result.errorType}</td>
                          <td className="text-center py-3 px-4">{result.totalPatterns}</td>
                          <td className="text-center py-3 px-4">{result.correctlyDetected}</td>
                          <td className="text-center py-3 px-4">
                            <Badge className={`${getAccuracyBg(result.detectionAccuracy)} ${getAccuracyColor(result.detectionAccuracy)} border-0`}>
                              {result.detectionAccuracy}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/50 font-semibold">
                        <td className="py-3 px-4">Overall</td>
                        <td className="text-center py-3 px-4">{report.summary.totalInjectedErrors}</td>
                        <td className="text-center py-3 px-4">
                          {report.patternDetection.results.reduce((sum, r) => sum + r.correctlyDetected, 0)}
                        </td>
                        <td className="text-center py-3 px-4">
                          <Badge className={`${getAccuracyBg(report.patternDetection.overallAccuracy)} ${getAccuracyColor(report.patternDetection.overallAccuracy)} border-0`}>
                            {report.patternDetection.overallAccuracy}%
                          </Badge>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* 2. Error Localization Accuracy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-secondary" />
                  {report.localizationAccuracy.title}
                </CardTitle>
                <CardDescription>{report.localizationAccuracy.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Error Type</th>
                        <th className="text-center py-3 px-4 font-semibold">Total Positions</th>
                        <th className="text-center py-3 px-4 font-semibold">Correctly Localized</th>
                        <th className="text-center py-3 px-4 font-semibold">Localization Accuracy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.localizationAccuracy.results.map((result) => (
                        <tr key={result.errorType} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{result.errorType}</td>
                          <td className="text-center py-3 px-4">{result.totalPositions}</td>
                          <td className="text-center py-3 px-4">{result.correctlyLocalized}</td>
                          <td className="text-center py-3 px-4">
                            <Badge className={`${getAccuracyBg(result.localizationAccuracy)} ${getAccuracyColor(result.localizationAccuracy)} border-0`}>
                              {result.localizationAccuracy}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/50 font-semibold">
                        <td className="py-3 px-4">Overall</td>
                        <td className="text-center py-3 px-4">
                          {report.localizationAccuracy.results.reduce((sum, r) => sum + r.totalPositions, 0)}
                        </td>
                        <td className="text-center py-3 px-4">
                          {report.localizationAccuracy.results.reduce((sum, r) => sum + r.correctlyLocalized, 0)}
                        </td>
                        <td className="text-center py-3 px-4">
                          <Badge className={`${getAccuracyBg(report.localizationAccuracy.overallAccuracy)} ${getAccuracyColor(report.localizationAccuracy.overallAccuracy)} border-0`}>
                            {report.localizationAccuracy.overallAccuracy}%
                          </Badge>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* 3. Comparative Baseline Evaluation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-accent" />
                  {report.baselineComparison.title}
                </CardTitle>
                <CardDescription>
                  {report.baselineComparison.description}
                  <span className="block mt-1 text-xs italic">{report.baselineComparison.note}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Tool</th>
                        <th className="text-center py-3 px-4 font-semibold">Error Reduction (%)</th>
                        <th className="text-center py-3 px-4 font-semibold">Reading Speed Improvement</th>
                        <th className="text-center py-3 px-4 font-semibold">Comprehension Score (1-5)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.baselineComparison.toolComparison.map((tool, idx) => (
                        <tr 
                          key={tool.tool} 
                          className={`border-b hover:bg-muted/50 ${tool.tool === 'IntelliRead' ? 'bg-primary/5' : ''}`}
                        >
                          <td className="py-3 px-4 font-medium">
                            {tool.tool}
                            {tool.tool === 'IntelliRead' && (
                              <Badge variant="outline" className="ml-2 text-xs">This System</Badge>
                            )}
                          </td>
                          <td className="text-center py-3 px-4">{tool.errorReduction}</td>
                          <td className="text-center py-3 px-4">{tool.readingSpeedImprovement}</td>
                          <td className="text-center py-3 px-4">{tool.comprehensionScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* 4. Explainability Evaluation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  {report.explainability.title}
                </CardTitle>
                <CardDescription>{report.explainability.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Scores */}
                <div className="grid md:grid-cols-3 gap-4">
                  {Object.entries(report.explainability.scores).map(([key, value]) => (
                    <div key={key} className="p-4 rounded-lg bg-muted">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-xl font-bold text-primary">{value.score}/5</span>
                      </div>
                      <Progress value={parseFloat(value.score) * 20} className="h-2 mb-2" />
                      <p className="text-xs text-muted-foreground">{value.description}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Sample Explanations */}
                <div>
                  <h4 className="font-semibold mb-4">Sample Explanation Outputs</h4>
                  <div className="space-y-3">
                    {report.explainability.sampleExplanations.map((sample, idx) => (
                      <div key={idx} className="p-4 rounded-lg border bg-background">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{sample.errorType}</Badge>
                          <span className="text-sm">
                            <span className="text-red-500 line-through">{sample.errorWord}</span>
                            {' → '}
                            <span className="text-green-600">{sample.correctWord}</span>
                          </span>
                        </div>
                        <p className="text-sm text-foreground italic">"{sample.explanation}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 5. Consistency Testing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCcw className="h-5 w-5 text-secondary" />
                  {report.consistency.title}
                </CardTitle>
                <CardDescription>{report.consistency.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Test Group</th>
                        <th className="text-center py-3 px-4 font-semibold">Error Type</th>
                        <th className="text-center py-3 px-4 font-semibold">Variants Tested</th>
                        <th className="text-center py-3 px-4 font-semibold">Consistent Detections</th>
                        <th className="text-center py-3 px-4 font-semibold">Consistency Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.consistency.results.map((result) => (
                        <tr key={result.groupId} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{result.groupId}</td>
                          <td className="text-center py-3 px-4">
                            <Badge variant="outline">{result.errorType}</Badge>
                          </td>
                          <td className="text-center py-3 px-4">{result.variants}</td>
                          <td className="text-center py-3 px-4">{result.consistentDetections}</td>
                          <td className="text-center py-3 px-4">
                            <Badge className={`${getAccuracyBg(result.consistencyRate)} ${getAccuracyColor(result.consistencyRate)} border-0`}>
                              {result.consistencyRate}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/50 font-semibold">
                        <td colSpan={4} className="py-3 px-4">Average Consistency Rate</td>
                        <td className="text-center py-3 px-4">
                          <Badge className={`${getAccuracyBg(report.consistency.averageConsistencyRate)} ${getAccuracyColor(report.consistency.averageConsistencyRate)} border-0`}>
                            {report.consistency.averageConsistencyRate}%
                          </Badge>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Interpretation & Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Results Interpretation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-foreground">{report.interpretation.summary}</p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Strengths
                    </h4>
                    <ul className="space-y-2">
                      {report.interpretation.strengths.map((strength, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      Limitations
                    </h4>
                    <ul className="space-y-2">
                      {report.interpretation.limitations.map((limitation, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-yellow-600 mt-1">•</span>
                          {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Separator />
                
                <div>
                  <h4 className="font-semibold mb-3">Recommendations for Improvement</h4>
                  <ul className="space-y-2">
                    {report.interpretation.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="font-bold text-primary">{idx + 1}.</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center italic">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  {report.disclaimer}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
