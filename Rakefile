$LOAD_PATH.unshift File.join(File.dirname(__FILE__), 'bin')

task default: :deploy

task :deploy do
  puts "Hello World"
  system('yarn --non-interactive && yarn --non-interactive run webpack')
end
