# frozen_string_literal: true
# 让 ```asm 和 ```assembly 代码块在构建时使用 Rouge 内置的 nasm 高亮器。
# Rouge 默认不注册 'asm'/'assembly' 语言别名，导致这两类代码块构建后无语法高亮。
# 本站使用 GitHub Actions 自定义构建（bundle exec jekyll build），可加载自定义插件。
begin
  require 'rouge'
  nasm = Rouge::Lexer.find('nasm')
  if nasm
    Rouge::Lexer.register('asm', nasm)
    Rouge::Lexer.register('assembly', nasm)
  end
rescue LoadError
  # Rouge 不可用时静默跳过，不影响构建
end
