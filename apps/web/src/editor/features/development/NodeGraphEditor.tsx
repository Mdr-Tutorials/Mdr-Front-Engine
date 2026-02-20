import '@xyflow/react/dist/style.css';
import './reactflow/nodeGraphEditor.css';
import { ReactFlowProvider } from '@xyflow/react';
import { NodeGraphEditorContent } from './reactflow/NodeGraphEditorContent';

function NodeGraphEditor() {
  return (
    <ReactFlowProvider>
      <NodeGraphEditorContent />
    </ReactFlowProvider>
  );
}

export default NodeGraphEditor;
