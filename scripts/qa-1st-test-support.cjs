const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),Module=require('node:module');
const source=fs.readFileSync(path.join(__dirname,'../hani-main.js'),'utf8');
function loadInputHelpers(context){
  const dates=source.slice(source.indexOf('function pad2DateFlex('),source.indexOf('function dateFlexPlaceholder('));
  const helpers=source.slice(source.indexOf('// QA 1st: input-only helpers.'),source.indexOf('// End QA 1st input-only helpers.'));
  vm.runInContext(dates+'\n'+helpers,context);
}
function parser(){const m=new Module('qa-acorn');m._compile(process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'],'qa-acorn');return m.exports;}
function assignments(text=source){
  const rows=[];function visit(node){if(!node||typeof node!=='object')return;
    if(node.type==='AssignmentExpression'&&node.left.type==='MemberExpression'&&node.left.property.name==='onclick'&&node.left.object.type==='CallExpression'&&node.left.object.callee.name==='$')rows.push({id:node.left.object.arguments[0]?.value,code:text.slice(node.right.start,node.right.end)});
    for(const value of Object.values(node))if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);
  }visit(parser().parse(text,{ecmaVersion:'latest'}));return rows;
}
function functionCode(name,text=source){const ast=parser().parse(text,{ecmaVersion:'latest'});let node=ast.body.find(node=>node.type==='FunctionDeclaration'&&node.id.name===name);if(!node)for(const item of ast.body)if(item.type==='VariableDeclaration'){node=item.declarations.find(row=>row.id.name===name);if(node)break;}if(!node)throw Error('missing function '+name);return text.slice(node.start,node.end);}
module.exports={source,loadInputHelpers,assignments,functionCode,parser};
