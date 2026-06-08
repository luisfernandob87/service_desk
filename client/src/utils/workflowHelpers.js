export function getOrderedNodes(nodes, edges) {
  if (!nodes?.length) return [];
  const startNode = nodes.find(n => n.data?.nodeType === 'start');
  if (!startNode || !edges?.length) return nodes;

  const result = [];
  const visited = new Set();

  function traverse(nodeId) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    result.push(node);
    const outgoing = edges.filter(e => e.source === nodeId);
    for (const edge of outgoing) {
      traverse(edge.target);
    }
  }

  traverse(startNode.id);

  const remaining = nodes.filter(n => !visited.has(n.id));
  return [...result, ...remaining];
}

function getNodeIndex(orderedNodes, nodeId) {
  return orderedNodes.findIndex(n => n.id === nodeId);
}

export function getStepStatus(node, execution, orderedNodes) {
  const isEnd = node.data?.nodeType === 'end';
  const isCondition = node.data?.nodeType === 'condition';
  const isNotification = node.data?.nodeType === 'notification';
  const isApprovalType = node.data?.nodeType === 'approval';

  if (execution.status === 'completed') return 'finish';
  if (execution.status === 'cancelled') {
    const approvalNode = (execution.approvals || []).find(a => a.source_node_id === node.id);
    if (isApprovalType && approvalNode?.status === 'rejected') return 'error';
    const currentIdx = getNodeIndex(orderedNodes, execution.current_node_id);
    const thisIdx = getNodeIndex(orderedNodes, node.id);
    if (thisIdx === -1 || currentIdx === -1) return 'wait';
    return thisIdx <= currentIdx ? 'finish' : 'wait';
  }

  const ticketNode = (execution.tickets || []).find(t => t.source_node_id === node.id);
  const approvalNode = (execution.approvals || []).find(a => a.source_node_id === node.id);

  if (ticketNode) {
    return ['resolved', 'closed'].includes(ticketNode.status) ? 'finish' : 'process';
  }

  if (isApprovalType && approvalNode) {
    if (approvalNode.status === 'approved') return 'finish';
    if (approvalNode.status === 'rejected') return 'error';
    return 'process';
  }

  const currentIdx = getNodeIndex(orderedNodes, execution.current_node_id);
  const thisIdx = getNodeIndex(orderedNodes, node.id);

  if (currentIdx === -1 || thisIdx === -1) return 'wait';
  if (thisIdx < currentIdx) return 'finish';
  if (thisIdx === currentIdx) return isEnd ? 'process' : 'finish';
  return 'wait';
}
