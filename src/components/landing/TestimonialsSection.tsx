import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  company: string;
  industry: string;
  image: string;
  quote: string;
  tier: string;
}

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export default function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  return (
    <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-accent/5 relative overflow-hidden">
      {/* Floating background elements */}
      <motion.div
        className="absolute top-20 left-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"
        animate={{
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"
        animate={{
          y: [0, -40, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Badge variant="secondary" className="mb-4 neu-inset">
              <Users className="h-3 w-3 mr-1" />
              Trusted by 8,200+ Businesses
            </Badge>
          </motion.div>
          <motion.h2
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 sm:mb-4"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            Real Results from Real People
          </motion.h2>
          <motion.p
            className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto px-2"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            See how businesses across industries are transforming with Pikar AI
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={`testimonial-${index}-${testimonial.name}`}
              initial={{ y: 50, opacity: 0, scale: 0.9 }}
              whileInView={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.15,
                type: "spring",
                stiffness: 100
              }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ 
                y: -8,
                transition: { duration: 0.3 }
              }}
            >
              <Card className="neu-raised rounded-2xl border-0 h-full hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
                {/* Animated gradient overlay on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-primary/0 group-hover:from-emerald-500/5 group-hover:to-primary/5 transition-all duration-500"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                />
                <CardContent className="p-6 relative z-10">
                  <motion.div 
                    className="flex items-start gap-4 mb-4"
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.15 + 0.2 }}
                    viewport={{ once: true }}
                  >
                    <motion.img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-14 h-14 rounded-full object-cover neu-raised"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&size=400&background=random`;
                      }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.company}</p>
                    </div>
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.15 + 0.4 }}
                      viewport={{ once: true }}
                    >
                      <Badge variant="outline" className="neu-inset text-xs">
                        {testimonial.tier}
                      </Badge>
                    </motion.div>
                  </motion.div>
                  
                  <motion.p 
                    className="text-sm text-foreground leading-relaxed mb-3"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.15 + 0.3 }}
                    viewport={{ once: true }}
                  >
                    "{testimonial.quote}"
                  </motion.p>
                  
                  <motion.div 
                    className="flex items-center gap-2 pt-3 border-t border-border/50"
                    initial={{ y: 10, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.15 + 0.5 }}
                    viewport={{ once: true }}
                  >
                    <Badge variant="secondary" className="text-xs neu-inset">
                      {testimonial.industry}
                    </Badge>
                    <div className="flex gap-0.5 ml-auto">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.span 
                          key={star} 
                          className="text-amber-500 text-sm"
                          initial={{ scale: 0, rotate: -180 }}
                          whileInView={{ scale: 1, rotate: 0 }}
                          transition={{ 
                            duration: 0.4, 
                            delay: index * 0.15 + 0.6 + (star * 0.05),
                            type: "spring",
                            stiffness: 200
                          }}
                          viewport={{ once: true }}
                          whileHover={{ scale: 1.3, rotate: 15 }}
                        >
                          ★
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8">
            {[
              { icon: CheckCircle, text: "4.9/5 Average Rating" },
              { icon: CheckCircle, text: "95% Customer Satisfaction" },
              { icon: CheckCircle, text: "12k+ Workflows Automated" }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                className="flex items-center gap-2"
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.6 + (idx * 0.1),
                  type: "spring",
                  stiffness: 150
                }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut"
                  }}
                >
                  <item.icon className="h-5 w-5 text-emerald-600" />
                </motion.div>
                <span className="text-sm font-medium">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
