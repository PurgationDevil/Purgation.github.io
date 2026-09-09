# frozen_string_literal: true
# 构建时（kramdown 渲染前）把 ```asm / ```assembly 代码围栏改写为 ```nasm，
# 使 Rouge 使用内置的 nasm 高亮器做服务端语法高亮。
# 使用 Jekyll pre_render 钩子做纯字符串改写，不依赖 Rouge 内部 API，避免版本差异导致构建失败。
Jekyll::Hooks.register(:documents, :pre_render) do |doc|
  begin
    c = doc.content
    next if c.nil? || c.empty?
    # 仅在存在目标围栏时处理；``` 后紧跟 asm/assembly 才匹配（闭合围栏 ``` 不匹配）
    c.gsub!(/```(?:asm|assembly)\b/, '```nasm')
  rescue StandardError => e
    Jekyll.logger.warn('asm_alias', "hook skipped: #{e.class}: #{e.message}")
  end
end

Jekyll::Hooks.register(:pages, :pre_render) do |page|
  begin
    c = page.content
    next if c.nil? || c.empty?
    c.gsub!(/```(?:asm|assembly)\b/, '```nasm')
  rescue StandardError => e
    Jekyll.logger.warn('asm_alias', "hook skipped: #{e.class}: #{e.message}")
  end
end
