// A historical presentation suite keeps its original feature bytes. Its raw
// input is still checked against independently committed deployed evidence.
import legacy from './hani-stale39-source.cjs';
import {readReviewedCurrentSource as current,readReviewedReleaseBaseline as baseline} from './hani-reviewed-release-baseline.mjs';
import support from './qa-1st-test-support.cjs';
import assert from 'node:assert/strict';
export const readReviewedCurrentSource=file=>legacy.project(current(file),file,'hero228');
export const readReviewedReleaseBaseline=file=>legacy.project(baseline(file),file,'hero228');
export function readSettingsQaBaseline(){
 const source=baseline('hani-main.js'),matches=[];
 const visit=node=>{
  if(!node||typeof node!=='object')return;
  if(node.type==='AssignmentExpression'&&node.left.type==='MemberExpression'&&node.left.property.name==='onclick'){
   const button=node.left.object;
   if(button.type==='CallExpression'&&button.callee.name==='$'&&button.arguments[0]?.value==='goalRegistryApprove')matches.push(node.right);
  }
  for(const value of Object.values(node))if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);
 };
 visit(support.parser().parse(source,{ecmaVersion:'latest'}));assert.equal(matches.length,1);
 const guard=matches[0];assert.equal(guard.type,'CallExpression');assert.equal(guard.callee.name,'saveEntry');assert.equal(guard.arguments.length,2);
 const [button,handler]=guard.arguments;assert.equal(source.slice(button.start,button.end),'$("goalRegistryApprove")');assert.equal(handler.type,'ArrowFunctionExpression');
 // Remove only the originally reviewed wrapper from the approved modern oracle.
 // All storage owners, handler bodies, EOL and later save guards stay modern.
 return source.slice(0,guard.start)+source.slice(handler.start,handler.end)+source.slice(guard.end);
}
